"""
Feature extractor for code complexity analysis.
Uses Python's AST (Abstract Syntax Tree) module to extract
structural features from source code for ML classification.
"""
import ast
import re


class CodeFeatureExtractor:
    """Extract numerical features from Python source code using AST analysis."""

    FEATURE_NAMES = [
        "lines_of_code",
        "source_lines",
        "blank_lines",
        "comment_lines",
        "num_functions",
        "num_classes",
        "num_imports",
        "num_if_statements",
        "num_loops",
        "num_try_except",
        "max_nesting_depth",
        "avg_function_length",
    ]

    def extract(self, code: str) -> dict:
        """Extract all features from a code string.

        Returns a dict with feature names as keys and numeric values.
        """
        lines = code.split("\n")
        features = {}

        # Basic line metrics
        features["lines_of_code"] = len(lines)
        features["source_lines"] = len([l for l in lines if l.strip()])
        features["blank_lines"] = len([l for l in lines if not l.strip()])
        features["comment_lines"] = len(
            [l for l in lines if l.strip().startswith("#")]
        )

        # AST-based features
        try:
            tree = ast.parse(code)
            features["num_functions"] = self._count_nodes(tree, ast.FunctionDef)
            features["num_classes"] = self._count_nodes(tree, ast.ClassDef)
            features["num_imports"] = self._count_nodes(
                tree, (ast.Import, ast.ImportFrom)
            )
            features["num_if_statements"] = self._count_nodes(tree, ast.If)
            features["num_loops"] = self._count_nodes(tree, (ast.For, ast.While))
            features["num_try_except"] = self._count_nodes(tree, ast.Try)
            features["max_nesting_depth"] = self._max_depth(tree)
            features["avg_function_length"] = self._avg_func_length(tree)
        except SyntaxError:
            # If code can't be parsed, use regex-based fallback
            features["num_functions"] = len(
                re.findall(r"^\s*def\s+", code, re.MULTILINE)
            )
            features["num_classes"] = len(
                re.findall(r"^\s*class\s+", code, re.MULTILINE)
            )
            features["num_imports"] = len(
                re.findall(r"^\s*(import|from)\s+", code, re.MULTILINE)
            )
            features["num_if_statements"] = len(
                re.findall(r"\bif\b", code)
            )
            features["num_loops"] = len(
                re.findall(r"\b(for|while)\b", code)
            )
            features["num_try_except"] = len(
                re.findall(r"\btry\b", code)
            )
            features["max_nesting_depth"] = self._estimate_depth(lines)
            features["avg_function_length"] = 0

        return features

    def extract_vector(self, code: str) -> list:
        """Extract features as an ordered list (for ML model input)."""
        features = self.extract(code)
        return [features[name] for name in self.FEATURE_NAMES]

    def _count_nodes(self, tree, node_types):
        """Count AST nodes of given type(s)."""
        if not isinstance(node_types, tuple):
            node_types = (node_types,)
        count = 0
        for node in ast.walk(tree):
            if isinstance(node, node_types):
                count += 1
        return count

    def _max_depth(self, tree, current=0):
        """Calculate maximum nesting depth of control flow structures."""
        max_d = current
        for node in ast.iter_child_nodes(tree):
            if isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.With)):
                child_depth = self._max_depth(node, current + 1)
                max_d = max(max_d, child_depth)
            else:
                child_depth = self._max_depth(node, current)
                max_d = max(max_d, child_depth)
        return max_d

    def _avg_func_length(self, tree):
        """Calculate average function length in lines."""
        functions = [
            node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)
        ]
        if not functions:
            return 0

        lengths = []
        for func in functions:
            if hasattr(func, "end_lineno") and hasattr(func, "lineno"):
                lengths.append(func.end_lineno - func.lineno + 1)
            else:
                lengths.append(5)  # default estimate

        return round(sum(lengths) / len(lengths), 1)

    def _estimate_depth(self, lines):
        """Estimate nesting depth from indentation when AST parsing fails."""
        max_indent = 0
        for line in lines:
            stripped = line.lstrip()
            if stripped:
                indent = len(line) - len(stripped)
                level = indent // 4  # assume 4-space indent
                max_indent = max(max_indent, level)
        return max_indent
