"""Offline CLI checks: uv run --with 'click>=8.1' python -m unittest discover -s tests"""

import importlib.machinery
import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch

from click.testing import CliRunner


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "agent-tools"
loader = importlib.machinery.SourceFileLoader("agent_tools", str(SCRIPT))
spec = importlib.util.spec_from_loader(loader.name, loader)
tools = importlib.util.module_from_spec(spec)
loader.exec_module(tools)


class AgentToolsTests(unittest.TestCase):
    def setUp(self):
        self.runner = CliRunner()
        self.enterContext(patch.dict(os.environ, {}, clear=True))
        # A forgotten mock must never reach git, gh, or a live mutation.
        self.enterContext(patch.object(tools.subprocess, "run", side_effect=AssertionError("unexpected subprocess")))

    def invoke(self, *args):
        return self.runner.invoke(tools.cli, list(args))

    def target(self):
        os.environ.update(AGENT_GITHUB_OWNER="chosen-owner", AGENT_GITHUB_REPO="chosen-repo")

    def test_help_needs_no_repository_or_auth(self):
        result = self.invoke("--help")
        self.assertEqual(result.exit_code, 0, result.output)

    def test_inferred_repository_is_explicit_on_label_edit(self):
        with patch.object(tools, "run", side_effect=["inferred/repository", ""]) as run:
            result = self.invoke("issue", "transition-state", "42", "old", "new")
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertEqual(run.call_args_list[0].args[0], [
            "gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner",
        ])
        self.assertEqual(run.call_args_list[1].args[0], [
            "gh", "issue", "edit", "42", "--repo", "inferred/repository",
            "--remove-label", "old", "--add-label", "new",
        ])

    def test_explicit_target_skips_inference_and_same_label_is_not_removed(self):
        self.target()
        with patch.object(tools, "run", return_value="") as run:
            result = self.invoke("issue", "transition-state", "42", "same", "same")
        self.assertEqual(result.exit_code, 0, result.output)
        run.assert_called_once_with([
            "gh", "issue", "edit", "42", "--repo", "chosen-owner/chosen-repo", "--add-label", "same",
        ])

    def test_partial_repository_override_fails_before_any_command(self):
        for variable in ("AGENT_GITHUB_OWNER", "AGENT_GITHUB_REPO"):
            with self.subTest(variable=variable), patch.dict(os.environ, {variable: "partial"}, clear=True):
                result = self.invoke("issue", "show-fields", "42")
                self.assertNotEqual(result.exit_code, 0)
                self.assertIn("set both", result.output)

    def test_native_issue_read_needs_no_project_and_uses_resolved_repo(self):
        self.target()
        data = {"data": {"repository": {"issue": {
            "number": 42, "title": "Test", "issueType": None,
            "labels": {"nodes": []}, "issueFieldValues": {"nodes": []},
            "projectItems": {"nodes": []},
        }}}}
        with patch.object(tools, "repo_graphql", return_value=data) as graphql:
            result = self.invoke("issue", "show-fields", "42")
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertEqual(graphql.call_args.kwargs, {"owner": "chosen-owner", "repo": "chosen-repo", "number": 42})

    def test_missing_or_partial_project_target_fails_before_mutation(self):
        self.target()
        for overrides in ({}, {"AGENT_GITHUB_PROJECT_OWNER": "board-owner"}, {"AGENT_GITHUB_PROJECT_NUMBER": "3"}):
            with self.subTest(overrides=overrides), patch.dict(os.environ, overrides):
                result = self.invoke("issue", "set-project-field", "42", "Scope", "MVP")
                self.assertNotEqual(result.exit_code, 0)
                self.assertIn("set AGENT_GITHUB_PROJECT_OWNER and AGENT_GITHUB_PROJECT_NUMBER", result.output)

    def test_invalid_project_number_fails_cleanly(self):
        self.target()
        for number in ("abc", "0", "-1", "²"):
            with self.subTest(number=number), patch.dict(os.environ, {
                "AGENT_GITHUB_PROJECT_OWNER": "board-owner", "AGENT_GITHUB_PROJECT_NUMBER": number,
            }):
                result = self.invoke("issue", "set-project-field", "42", "Scope", "MVP")
                self.assertNotEqual(result.exit_code, 0)
                self.assertIn("positive integer", result.output)

    def test_project_owner_can_differ_from_repository_owner(self):
        self.target()
        os.environ.update(AGENT_GITHUB_PROJECT_OWNER="board-owner", AGENT_GITHUB_PROJECT_NUMBER="7")
        metadata = {"data": {"organization": {"projectV2": {
            "id": "project-id", "fields": {"nodes": [{
                "id": "field-id", "name": "Scope", "__typename": "ProjectV2SingleSelectField",
                "options": [{"id": "option-id", "name": "MVP"}],
            }]},
        }}}}
        with (
            patch.object(tools, "cached", side_effect=lambda key, produce, **kwargs: produce()) as cached,
            patch.object(tools, "repo_graphql", side_effect=[metadata, {}]) as graphql,
            patch.object(tools, "project_item_id", return_value="item-id") as item,
        ):
            result = self.invoke("issue", "set-project-field", "42", "Scope", "MVP", "--refresh")
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertEqual(graphql.call_args_list[0].kwargs, {"owner": "board-owner", "number": 7})
        self.assertEqual(cached.call_args.args[0], "project:board-owner/7")
        self.assertTrue(cached.call_args.kwargs["refresh"])
        item.assert_called_once_with("project-id", 42)
        self.assertEqual(graphql.call_args_list[1].kwargs, {
            "projectId": "project-id", "itemId": "item-id", "field0": "field-id", "option0": "option-id",
        })


if __name__ == "__main__":
    unittest.main()
