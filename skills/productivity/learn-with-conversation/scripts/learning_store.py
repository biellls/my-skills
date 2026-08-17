#!/usr/bin/env python3
"""Deterministic per-project persistence for learn-with-conversation."""

import argparse
import json
import sqlite3
import sys
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

DB_RELATIVE_PATH = Path(".scratch") / "learn-with-conversation.sqlite3"
INTERVAL_DAYS = (1, 3, 7, 14, 30)
DIFFICULTIES = (
    "missing-prerequisite",
    "gap",
    "conflation",
    "misconception",
    "forgotten",
)


class StoreError(Exception):
    pass


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def isoformat(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_time(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise StoreError("timestamps must be ISO 8601 values") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold().strip()
    return " ".join(normalized.split())


def db_path() -> Path:
    return Path.cwd() / DB_RELATIVE_PATH


def connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(path))
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    migrate(connection)
    return connection


def migrate(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            normalized_name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS topic_aliases (
            id INTEGER PRIMARY KEY,
            topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
            alias TEXT NOT NULL,
            normalized_alias TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(topic_id, normalized_alias)
        );

        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY,
            topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
            label TEXT NOT NULL,
            normalized_label TEXT NOT NULL,
            formal_name TEXT,
            parent_concept_id INTEGER REFERENCES concepts(id),
            created_at TEXT NOT NULL,
            UNIQUE(topic_id, normalized_label)
        );

        CREATE TABLE IF NOT EXISTS ledger (
            id INTEGER PRIMARY KEY,
            topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
            concept_id INTEGER REFERENCES concepts(id),
            occurred_at TEXT NOT NULL,
            event_type TEXT NOT NULL CHECK(event_type IN (
                'introduced', 'formal_name_revealed', 'root_selected',
                'question_asked', 'assessed'
            )),
            observation TEXT NOT NULL CHECK(length(trim(observation)) > 0),
            question_text TEXT,
            response_summary TEXT,
            disclosure TEXT CHECK(disclosure IS NULL OR disclosure IN ('implicit', 'named')),
            understanding TEXT CHECK(understanding IS NULL OR understanding IN ('partial', 'demonstrated')),
            assistance TEXT CHECK(assistance IS NULL OR assistance IN ('none', 'light', 'heavy')),
            difficulties_json TEXT,
            angle TEXT,
            is_review INTEGER NOT NULL DEFAULT 0 CHECK(is_review IN (0, 1)),
            related_event_id INTEGER REFERENCES ledger(id)
        );

        CREATE INDEX IF NOT EXISTS ledger_topic_time
            ON ledger(topic_id, occurred_at, id);
        CREATE INDEX IF NOT EXISTS ledger_concept_time
            ON ledger(concept_id, occurred_at, id);
        """
    )
    row = connection.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
    if row is None:
        connection.execute("INSERT INTO schema_version(version) VALUES (1)")
    elif row["version"] != 1:
        raise StoreError("unsupported learning-store schema version")
    connection.commit()


def emit(payload: Any) -> None:
    print(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True))


def require_topic(connection: sqlite3.Connection, topic_id: int) -> sqlite3.Row:
    row = connection.execute("SELECT * FROM topics WHERE id = ?", (topic_id,)).fetchone()
    if row is None:
        raise StoreError("topic not found: {}".format(topic_id))
    return row


def require_concept(
    connection: sqlite3.Connection, concept_id: int, topic_id: Optional[int] = None
) -> sqlite3.Row:
    row = connection.execute("SELECT * FROM concepts WHERE id = ?", (concept_id,)).fetchone()
    if row is None:
        raise StoreError("concept not found: {}".format(concept_id))
    if topic_id is not None and row["topic_id"] != topic_id:
        raise StoreError("concept does not belong to topic")
    return row


def append_event(
    connection: sqlite3.Connection,
    *,
    topic_id: int,
    concept_id: Optional[int],
    event_type: str,
    observation: str,
    occurred_at: Optional[str] = None,
    question_text: Optional[str] = None,
    response_summary: Optional[str] = None,
    disclosure: Optional[str] = None,
    understanding: Optional[str] = None,
    assistance: Optional[str] = None,
    difficulties: Optional[Sequence[str]] = None,
    angle: Optional[str] = None,
    is_review: bool = False,
    related_event_id: Optional[int] = None,
) -> sqlite3.Row:
    require_topic(connection, topic_id)
    if concept_id is not None:
        require_concept(connection, concept_id, topic_id)
    if not observation.strip():
        raise StoreError("every ledger event requires a non-empty observation")
    if related_event_id is not None:
        related = connection.execute("SELECT topic_id FROM ledger WHERE id = ?", (related_event_id,)).fetchone()
        if related is None or related["topic_id"] != topic_id:
            raise StoreError("related event does not belong to topic")
    timestamp = isoformat(parse_time(occurred_at)) if occurred_at else isoformat(now_utc())
    cursor = connection.execute(
        """
        INSERT INTO ledger(
            topic_id, concept_id, occurred_at, event_type, observation,
            question_text, response_summary, disclosure, understanding,
            assistance, difficulties_json, angle, is_review, related_event_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            topic_id,
            concept_id,
            timestamp,
            event_type,
            observation.strip(),
            question_text,
            response_summary,
            disclosure,
            understanding,
            assistance,
            json.dumps(list(difficulties or [])),
            angle,
            int(is_review),
            related_event_id,
        ),
    )
    connection.commit()
    return connection.execute("SELECT * FROM ledger WHERE id = ?", (cursor.lastrowid,)).fetchone()


def event_dict(row: sqlite3.Row) -> Dict[str, Any]:
    result = dict(row)
    result["is_review"] = bool(result["is_review"])
    result["difficulties"] = json.loads(result.pop("difficulties_json") or "[]")
    return result


def topic_dict(connection: sqlite3.Connection, row: sqlite3.Row) -> Dict[str, Any]:
    aliases = connection.execute(
        "SELECT alias FROM topic_aliases WHERE topic_id = ? ORDER BY normalized_alias", (row["id"],)
    ).fetchall()
    return {
        "id": row["id"],
        "name": row["name"],
        "aliases": [alias["alias"] for alias in aliases],
        "created_at": row["created_at"],
    }


def cmd_init(_: argparse.Namespace) -> None:
    with connect() as connection:
        version = connection.execute("SELECT version FROM schema_version").fetchone()["version"]
    emit({"database": str(db_path()), "schema_version": version})


def cmd_topics(_: argparse.Namespace) -> None:
    with connect() as connection:
        rows = connection.execute("SELECT * FROM topics ORDER BY normalized_name").fetchall()
        topics = [topic_dict(connection, row) for row in rows]
    emit({"database": str(db_path()), "topics": topics})


def cmd_topic_find(args: argparse.Namespace) -> None:
    query = normalize(args.query)
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT DISTINCT t.*,
                CASE
                    WHEN t.normalized_name = ? THEN 0
                    WHEN EXISTS(
                        SELECT 1 FROM topic_aliases a
                        WHERE a.topic_id = t.id AND a.normalized_alias = ?
                    ) THEN 0
                    WHEN t.normalized_name LIKE ? THEN 1
                    ELSE 2
                END AS rank
            FROM topics t
            LEFT JOIN topic_aliases a ON a.topic_id = t.id
            WHERE t.normalized_name LIKE ? OR a.normalized_alias LIKE ?
            ORDER BY rank, t.normalized_name
            """,
            (query, query, query + "%", "%" + query + "%", "%" + query + "%"),
        ).fetchall()
        matches = [dict(topic_dict(connection, row), match="exact" if row["rank"] == 0 else "candidate") for row in rows]
    emit({"database": str(db_path()), "query": args.query, "matches": matches})


def cmd_topic_create(args: argparse.Namespace) -> None:
    timestamp = isoformat(now_utc())
    with connect() as connection:
        try:
            cursor = connection.execute(
                "INSERT INTO topics(name, normalized_name, created_at) VALUES (?, ?, ?)",
                (args.name.strip(), normalize(args.name), timestamp),
            )
            topic_id = cursor.lastrowid
            for alias in args.alias:
                connection.execute(
                    "INSERT INTO topic_aliases(topic_id, alias, normalized_alias, created_at) VALUES (?, ?, ?, ?)",
                    (topic_id, alias.strip(), normalize(alias), timestamp),
                )
            connection.commit()
        except sqlite3.IntegrityError as exc:
            raise StoreError("topic or alias already exists") from exc
        row = require_topic(connection, topic_id)
        result = topic_dict(connection, row)
    emit({"database": str(db_path()), "topic": result})


def cmd_topic_alias(args: argparse.Namespace) -> None:
    with connect() as connection:
        require_topic(connection, args.topic_id)
        try:
            connection.execute(
                "INSERT INTO topic_aliases(topic_id, alias, normalized_alias, created_at) VALUES (?, ?, ?, ?)",
                (args.topic_id, args.alias.strip(), normalize(args.alias), isoformat(now_utc())),
            )
            connection.commit()
        except sqlite3.IntegrityError as exc:
            raise StoreError("alias already exists for this topic") from exc
        result = topic_dict(connection, require_topic(connection, args.topic_id))
    emit({"database": str(db_path()), "topic": result})


def cmd_concept_create(args: argparse.Namespace) -> None:
    with connect() as connection:
        require_topic(connection, args.topic_id)
        if args.parent_id is not None:
            require_concept(connection, args.parent_id, args.topic_id)
        try:
            cursor = connection.execute(
                """
                INSERT INTO concepts(
                    topic_id, label, normalized_label, formal_name, parent_concept_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    args.topic_id,
                    args.label.strip(),
                    normalize(args.label),
                    args.formal_name,
                    args.parent_id,
                    isoformat(now_utc()),
                ),
            )
            connection.commit()
        except sqlite3.IntegrityError as exc:
            raise StoreError("concept already exists for this topic") from exc
        result = dict(require_concept(connection, cursor.lastrowid, args.topic_id))
    emit({"database": str(db_path()), "concept": result})


def cmd_concepts(args: argparse.Namespace) -> None:
    with connect() as connection:
        require_topic(connection, args.topic_id)
        rows = connection.execute(
            "SELECT * FROM concepts WHERE topic_id = ? ORDER BY id", (args.topic_id,)
        ).fetchall()
    emit({"database": str(db_path()), "concepts": [dict(row) for row in rows]})


def cmd_introduce(args: argparse.Namespace) -> None:
    with connect() as connection:
        concept = require_concept(connection, args.concept_id, args.topic_id)
        if args.disclosure == "named" and args.formal_name:
            connection.execute(
                "UPDATE concepts SET formal_name = ? WHERE id = ?", (args.formal_name, args.concept_id)
            )
        row = append_event(
            connection,
            topic_id=args.topic_id,
            concept_id=args.concept_id,
            event_type="introduced",
            observation=args.observation,
            occurred_at=args.at,
            disclosure=args.disclosure,
        )
        concept = require_concept(connection, concept["id"], args.topic_id)
    emit({"database": str(db_path()), "concept": dict(concept), "event": event_dict(row)})


def cmd_reveal_name(args: argparse.Namespace) -> None:
    with connect() as connection:
        require_concept(connection, args.concept_id, args.topic_id)
        connection.execute(
            "UPDATE concepts SET formal_name = ? WHERE id = ?", (args.formal_name.strip(), args.concept_id)
        )
        row = append_event(
            connection,
            topic_id=args.topic_id,
            concept_id=args.concept_id,
            event_type="formal_name_revealed",
            observation=args.observation,
            occurred_at=args.at,
            disclosure="named",
        )
        concept = require_concept(connection, args.concept_id, args.topic_id)
    emit({"database": str(db_path()), "concept": dict(concept), "event": event_dict(row)})


def cmd_set_root(args: argparse.Namespace) -> None:
    with connect() as connection:
        row = append_event(
            connection,
            topic_id=args.topic_id,
            concept_id=args.concept_id,
            event_type="root_selected",
            observation=args.observation,
            occurred_at=args.at,
        )
    emit({"database": str(db_path()), "event": event_dict(row)})


def cmd_question(args: argparse.Namespace) -> None:
    with connect() as connection:
        row = append_event(
            connection,
            topic_id=args.topic_id,
            concept_id=args.concept_id,
            event_type="question_asked",
            observation=args.observation,
            occurred_at=args.at,
            question_text=args.text.strip(),
            angle=args.angle,
            is_review=args.review,
        )
    emit({"database": str(db_path()), "event": event_dict(row)})


def cmd_assess(args: argparse.Namespace) -> None:
    difficulties = args.difficulty or []
    if args.understanding == "demonstrated":
        if args.assistance != "none":
            raise StoreError("demonstrated understanding must be independent (assistance: none)")
        if difficulties:
            raise StoreError("demonstrated understanding cannot include a current difficulty")
        if not args.angle:
            raise StoreError("demonstrated understanding requires an angle")
    with connect() as connection:
        row = append_event(
            connection,
            topic_id=args.topic_id,
            concept_id=args.concept_id,
            event_type="assessed",
            observation=args.observation,
            occurred_at=args.at,
            response_summary=args.response_summary.strip(),
            understanding=args.understanding,
            assistance=args.assistance,
            difficulties=difficulties,
            angle=args.angle,
            is_review=args.review,
            related_event_id=args.question_event_id,
        )
        state = concept_state(connection, args.concept_id, parse_time(row["occurred_at"]))
    emit({"database": str(db_path()), "event": event_dict(row), "state": state})


def current_root(connection: sqlite3.Connection, topic_id: int) -> Optional[int]:
    row = connection.execute(
        """
        SELECT concept_id FROM ledger
        WHERE topic_id = ? AND event_type = 'root_selected'
        ORDER BY occurred_at DESC, id DESC LIMIT 1
        """,
        (topic_id,),
    ).fetchone()
    return row["concept_id"] if row else None


def concept_state(
    connection: sqlite3.Connection, concept_id: int, at: Optional[datetime] = None
) -> Dict[str, Any]:
    at = at or now_utc()
    concept = require_concept(connection, concept_id)
    rows = connection.execute(
        """
        SELECT * FROM ledger
        WHERE concept_id = ? AND occurred_at <= ?
        ORDER BY occurred_at, id
        """,
        (concept_id, isoformat(at)),
    ).fetchall()

    disclosure: Optional[str] = None
    understanding: Optional[str] = None
    difficulty: List[str] = []
    assistance: Optional[str] = None
    interval_index: Optional[int] = None
    due_at: Optional[datetime] = None
    demonstrated_angles = set()
    delayed_review_succeeded = False
    last_evidence_at: Optional[str] = None

    for row in rows:
        event_type = row["event_type"]
        occurred = parse_time(row["occurred_at"])
        if row["disclosure"] == "named" or disclosure is None:
            disclosure = row["disclosure"] or disclosure
        if event_type == "introduced" and understanding is None:
            understanding = "introduced"
            last_evidence_at = row["occurred_at"]
        if event_type != "assessed":
            continue

        last_evidence_at = row["occurred_at"]
        previous_understanding = understanding
        understanding = row["understanding"]
        assistance = row["assistance"]
        difficulty = json.loads(row["difficulties_json"] or "[]")

        if understanding == "demonstrated":
            if row["angle"]:
                demonstrated_angles.add(normalize(row["angle"]))
            if interval_index is None:
                interval_index = 0
                due_at = occurred + timedelta(days=INTERVAL_DAYS[interval_index])
            elif row["is_review"] and due_at is not None and occurred >= due_at:
                completed_interval = INTERVAL_DAYS[interval_index]
                if completed_interval >= 7:
                    delayed_review_succeeded = True
                interval_index = min(interval_index + 1, len(INTERVAL_DAYS) - 1)
                due_at = occurred + timedelta(days=INTERVAL_DAYS[interval_index])
            elif previous_understanding == "partial":
                # A repaired gap still needs reinforcement one day after the repair.
                due_at = occurred + timedelta(days=1)
            elif difficulty or assistance != "none":
                # Defensive only; the CLI rejects this contradictory event.
                due_at = occurred + timedelta(days=1)
            elif due_at is None:
                due_at = occurred + timedelta(days=INTERVAL_DAYS[interval_index])
        else:
            severe = "forgotten" in difficulty or "misconception" in difficulty
            if severe and interval_index is not None:
                interval_index = 0
                due_at = occurred + timedelta(days=1)
            elif interval_index is not None:
                due_at = occurred + timedelta(days=1)
            else:
                due_at = None

    mastered = (
        understanding == "demonstrated"
        and len(demonstrated_angles) >= 3
        and delayed_review_succeeded
    )
    current_level = "mastered" if mastered else understanding
    is_due = bool(due_at is not None and due_at <= at)
    unresolved = current_level in ("introduced", "partial")

    return {
        "concept_id": concept_id,
        "topic_id": concept["topic_id"],
        "label": concept["label"],
        "formal_name": concept["formal_name"],
        "parent_concept_id": concept["parent_concept_id"],
        "disclosure": disclosure,
        "understanding": current_level,
        "difficulty": difficulty,
        "assistance": assistance,
        "demonstrated_angle_count": len(demonstrated_angles),
        "delayed_review_succeeded": delayed_review_succeeded,
        "review_interval_days": INTERVAL_DAYS[interval_index] if interval_index is not None else None,
        "next_review_at": isoformat(due_at) if due_at is not None else None,
        "due": is_due,
        "unresolved": unresolved,
        "last_evidence_at": last_evidence_at,
    }


def cmd_resume(args: argparse.Namespace) -> None:
    at = parse_time(args.at) if args.at else now_utc()
    with connect() as connection:
        topic = require_topic(connection, args.topic_id)
        root_id = current_root(connection, args.topic_id)
        concepts = connection.execute(
            "SELECT id FROM concepts WHERE topic_id = ? ORDER BY id", (args.topic_id,)
        ).fetchall()
        states = [concept_state(connection, row["id"], at) for row in concepts]
        due = [state for state in states if state["due"]]
        due.sort(key=lambda state: (state["concept_id"] != root_id, state["next_review_at"] or ""))
        unresolved = [state for state in states if state["unresolved"] and not state["due"]]
        unresolved.sort(key=lambda state: state["last_evidence_at"] or "", reverse=True)
        questions = connection.execute(
            """
            SELECT id, concept_id, occurred_at, question_text, angle, is_review, observation
            FROM ledger
            WHERE topic_id = ? AND event_type = 'question_asked'
            ORDER BY occurred_at DESC, id DESC LIMIT ?
            """,
            (args.topic_id, args.question_limit),
        ).fetchall()
        recent_questions = [dict(row) for row in questions]
        for question in recent_questions:
            question["is_review"] = bool(question["is_review"])
        root = None
        if root_id is not None:
            root = concept_state(connection, root_id, at)
        result_topic = topic_dict(connection, topic)
    emit(
        {
            "database": str(db_path()),
            "as_of": isoformat(at),
            "topic": result_topic,
            "root": root,
            "due": due,
            "unresolved": unresolved,
            "recent_questions": recent_questions,
        }
    )


def cmd_history(args: argparse.Namespace) -> None:
    with connect() as connection:
        require_topic(connection, args.topic_id)
        rows = connection.execute(
            """
            SELECT * FROM ledger WHERE topic_id = ?
            ORDER BY occurred_at DESC, id DESC LIMIT ?
            """,
            (args.topic_id, args.limit),
        ).fetchall()
    emit({"database": str(db_path()), "events": [event_dict(row) for row in rows]})


def add_event_time(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--at", help="ISO 8601 event time; defaults to now in UTC")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Manage per-project learn-with-conversation history. Output is JSON."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    command = subparsers.add_parser("init", help="create or migrate the project learning store")
    command.set_defaults(handler=cmd_init)

    command = subparsers.add_parser("topics", help="list topics")
    command.set_defaults(handler=cmd_topics)

    command = subparsers.add_parser("topic-find", help="find a topic by name or alias")
    command.add_argument("query")
    command.set_defaults(handler=cmd_topic_find)

    command = subparsers.add_parser("topic-create", help="create a topic")
    command.add_argument("name")
    command.add_argument("--alias", action="append", default=[])
    command.set_defaults(handler=cmd_topic_create)

    command = subparsers.add_parser("topic-alias", help="add an alias to a topic")
    command.add_argument("topic_id", type=int)
    command.add_argument("alias")
    command.set_defaults(handler=cmd_topic_alias)

    command = subparsers.add_parser("concept-create", help="create a teaching concept")
    command.add_argument("topic_id", type=int)
    command.add_argument("label", help="concise internal description; need not be the formal term")
    command.add_argument("--parent-id", type=int)
    command.add_argument("--formal-name")
    command.set_defaults(handler=cmd_concept_create)

    command = subparsers.add_parser("concepts", help="list concepts for a topic")
    command.add_argument("topic_id", type=int)
    command.set_defaults(handler=cmd_concepts)

    command = subparsers.add_parser("introduce", help="record that a concept was introduced")
    command.add_argument("topic_id", type=int)
    command.add_argument("concept_id", type=int)
    command.add_argument("--disclosure", choices=("implicit", "named"), required=True)
    command.add_argument("--formal-name")
    command.add_argument("--observation", required=True)
    add_event_time(command)
    command.set_defaults(handler=cmd_introduce)

    command = subparsers.add_parser("reveal-name", help="record disclosure of a formal name")
    command.add_argument("topic_id", type=int)
    command.add_argument("concept_id", type=int)
    command.add_argument("formal_name")
    command.add_argument("--observation", required=True)
    add_event_time(command)
    command.set_defaults(handler=cmd_reveal_name)

    command = subparsers.add_parser("set-root", help="select or revise the topic root concept")
    command.add_argument("topic_id", type=int)
    command.add_argument("concept_id", type=int)
    command.add_argument("--observation", required=True)
    add_event_time(command)
    command.set_defaults(handler=cmd_set_root)

    command = subparsers.add_parser("question", help="record a question before presenting it")
    command.add_argument("topic_id", type=int)
    command.add_argument("concept_id", type=int)
    command.add_argument("--text", required=True)
    command.add_argument("--angle")
    command.add_argument("--review", action="store_true")
    command.add_argument("--observation", required=True)
    add_event_time(command)
    command.set_defaults(handler=cmd_question)

    command = subparsers.add_parser("assess", help="append evidence from a learner response")
    command.add_argument("topic_id", type=int)
    command.add_argument("concept_id", type=int)
    command.add_argument("--understanding", choices=("partial", "demonstrated"), required=True)
    command.add_argument("--assistance", choices=("none", "light", "heavy"), required=True)
    command.add_argument("--difficulty", choices=DIFFICULTIES, action="append", default=[])
    command.add_argument("--response-summary", required=True)
    command.add_argument("--angle")
    command.add_argument("--review", action="store_true")
    command.add_argument("--question-event-id", type=int)
    command.add_argument("--observation", required=True)
    add_event_time(command)
    command.set_defaults(handler=cmd_assess)

    command = subparsers.add_parser("resume", help="derive due and unresolved concepts for a topic")
    command.add_argument("topic_id", type=int)
    command.add_argument("--at", help="derive state at this ISO 8601 time")
    command.add_argument("--question-limit", type=int, default=30)
    command.set_defaults(handler=cmd_resume)

    command = subparsers.add_parser("history", help="show recent ledger events for a topic")
    command.add_argument("topic_id", type=int)
    command.add_argument("--limit", type=int, default=50)
    command.set_defaults(handler=cmd_history)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.handler(args)
    except (StoreError, sqlite3.Error, OSError) as exc:
        print(json.dumps({"error": str(exc), "database": str(db_path())}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
