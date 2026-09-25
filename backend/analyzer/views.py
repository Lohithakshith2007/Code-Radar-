import os
import json
import traceback
import ast
import traceback

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from radon.complexity import cc_visit
from radon.metrics import h_visit, mi_visit
from radon.raw import analyze

from .models import AnalysisRecord

# --- ML Model Loading ---
import joblib
import numpy as np
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent / "ml_model"
_ml_model = None
_ml_scaler = None

def get_ml_model():
    global _ml_model, _ml_scaler
    if _ml_model is None:
        model_path = ML_DIR / "complexity_model.pkl"
        scaler_path = ML_DIR / "scaler.pkl"
        if model_path.exists() and scaler_path.exists():
            _ml_model = joblib.load(model_path)
            _ml_scaler = joblib.load(scaler_path)
    return _ml_model, _ml_scaler

# --- Feature Extraction (import from ml_model) ---
import sys
sys.path.insert(0, str(ML_DIR.parent))
from ml_model.feature_extractor import CodeFeatureExtractor

feature_extractor = CodeFeatureExtractor()


def compute_complexity(code):
    """Compute real code complexity metrics using radon + ML model."""
    result = {
        "loc": {},
        "cyclomatic": [],
        "halstead": {},
        "maintainability_index": 0,
        "avg_complexity": 0,
        "score": "Low",
        "ml_prediction": None,
        "ml_confidence": None,
        "features": {},
    }

    # --- Raw LOC metrics ---
    try:
        raw = analyze(code)
        result["loc"] = {
            "total_lines": raw.loc,
            "source_lines": raw.sloc,
            "blank_lines": raw.blank,
            "comment_lines": raw.comments,
            "multi_line_strings": raw.multi,
        }
    except Exception:
        lines = code.split("\n")
        result["loc"] = {
            "total_lines": len(lines),
            "source_lines": len([l for l in lines if l.strip()]),
            "blank_lines": len([l for l in lines if not l.strip()]),
            "comment_lines": len([l for l in lines if l.strip().startswith("#")]),
            "multi_line_strings": 0,
        }

    # --- Cyclomatic Complexity ---
    try:
        cc_results = cc_visit(code)
        for block in cc_results:
            result["cyclomatic"].append({
                "name": block.name,
                "type": block.letter,
                "complexity": block.complexity,
                "line_start": block.lineno,
                "col_offset": block.col_offset,
            })
        if cc_results:
            avg = sum(b.complexity for b in cc_results) / len(cc_results)
            result["avg_complexity"] = round(avg, 2)
    except Exception:
        keywords = ["if", "for", "while", "elif", "except", "with", "case"]
        count = sum(code.count(k) for k in keywords)
        result["avg_complexity"] = count
        result["cyclomatic"] = [{"name": "overall", "type": "?", "complexity": count, "line_start": 1, "col_offset": 0}]

    # --- Halstead Metrics ---
    try:
        h = h_visit(code)
        if h.total and h.total.h1 is not None:
            result["halstead"] = {
                "h1": h.total.h1,
                "h2": h.total.h2,
                "N1": h.total.N1,
                "N2": h.total.N2,
                "vocabulary": h.total.vocabulary,
                "length": h.total.length,
                "volume": round(h.total.volume, 2) if h.total.volume else 0,
                "difficulty": round(h.total.difficulty, 2) if h.total.difficulty else 0,
                "effort": round(h.total.effort, 2) if h.total.effort else 0,
                "bugs": round(h.total.bugs, 4) if h.total.bugs else 0,
                "time": round(h.total.time, 2) if h.total.time else 0,
            }
    except Exception:
        result["halstead"] = {}

    # --- Maintainability Index ---
    try:
        mi = mi_visit(code, True)
        result["maintainability_index"] = round(mi, 2)
    except Exception:
        result["maintainability_index"] = 0

    # --- Radon-based Score ---
    avg = result["avg_complexity"]
    if avg > 10:
        result["score"] = "High"
    elif avg > 5:
        result["score"] = "Medium"
    else:
        result["score"] = "Low"

    # --- ML Model Prediction ---
    try:
        features = feature_extractor.extract(code)
        result["features"] = features
        feature_vector = feature_extractor.extract_vector(code)
        
        model, scaler = get_ml_model()
        if model is not None and scaler is not None:
            X = scaler.transform([feature_vector])
            prediction = model.predict(X)[0]
            probabilities = model.predict_proba(X)[0]
            confidence = round(float(max(probabilities)) * 100, 1)
            
            result["ml_prediction"] = prediction
            result["ml_confidence"] = confidence
            result["ml_probabilities"] = {
                label: round(float(prob) * 100, 1)
                for label, prob in zip(model.classes_, probabilities)
            }
    except Exception as e:
        result["ml_prediction"] = None
        result["ml_confidence"] = None
        result["ml_error"] = str(e)

    return result

@api_view(["POST"])
def analyze_code(request):
    """Analyze code complexity and return detailed metrics."""
    code = request.data.get("code", "")
    if not code.strip():
        return Response(
            {"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Detect language using keyword heuristics first to avoid Pygments hallucinations
    detected_lang = "Unknown"
    code_lower = code.lower()
    
    if "def " in code_lower and (":" in code_lower or "import " in code_lower):
        detected_lang = "Python"
    elif "console.log" in code_lower or "=>" in code_lower or "function " in code_lower or "const " in code_lower or "document." in code_lower:
        detected_lang = "JavaScript"
    elif "public class" in code_lower and "system.out" in code_lower:
        detected_lang = "Java"
    elif "fmt.print" in code_lower or ("func " in code_lower and "package " in code_lower):
        detected_lang = "Go"
    elif "#include" in code_lower or "int main" in code_lower:
        detected_lang = "C / C++"
    elif "<?php" in code_lower or "echo $" in code_lower:
        detected_lang = "PHP"
    elif "<html>" in code_lower or "<div" in code_lower or "react" in code_lower:
        detected_lang = "HTML / JSX"
    else:
        try:
            from pygments.lexers import guess_lexer
            lexer = guess_lexer(code)
            if lexer.name not in ["Text only", "Text", "Raw token data", "NumPy"]:
                detected_lang = lexer.name
        except Exception:
            pass

    # Validate Python Code only if detected as Python
    if detected_lang.lower() == "python":
        try:
            ast.parse(code)
        except Exception as e:
            # Catch SyntaxError, IndentationError, etc.
            error_msg = str(e)
            if hasattr(e, 'lineno') and hasattr(e, 'msg'):
                error_msg = f"Line {e.lineno}: {e.msg}"
            return Response(
                {
                    "error": f"Syntax Error: {error_msg}\nMake sure you provide valid Python code.",
                    "syntax_error": True,
                    "language": "Python"
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )

    try:
        metrics = compute_complexity(code)
        metrics["language"] = detected_lang

    except Exception as e:
        return Response(
            {"error": f"Analysis failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Save to history
    try:
        AnalysisRecord.objects.create(
            user=request.user,
            code_snippet=code[:2000],
            metrics=metrics,
            score=metrics.get("ml_prediction") or metrics["score"],
        )
    except Exception:
        pass

    return Response(metrics)


@api_view(["POST"])
def ai_suggest(request):
    """Get AI-powered refactoring suggestions using Groq."""
    code = request.data.get("code", "")
    metrics = request.data.get("metrics", {})

    if not code.strip():
        return Response(
            {"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Dynamically load .env in case user just saved it
    try:
        from dotenv import load_dotenv
        from core.settings import BASE_DIR
        load_dotenv(BASE_DIR / ".env", override=True)
    except Exception:
        pass

    api_key = os.environ.get("GROQ_API_KEY", "").strip()

    if not api_key or api_key == "your_api_key_here":
        suggestion = generate_rule_based_suggestions(code, metrics)
        return Response({"suggestion": suggestion, "source": "rule-based"})

    try:
        from groq import Groq

        client = Groq(api_key=api_key)

        prompt = f"""You are a senior software engineer. Analyze this {metrics.get('language', 'code')} for complexity and provide specific, actionable refactoring suggestions.

Code ({metrics.get('language', 'Unknown language')}):
```
{code[:3000]}
```

Metrics:
- Average Cyclomatic Complexity: {metrics.get('avg_complexity', 'N/A')}
- Maintainability Index: {metrics.get('maintainability_index', 'N/A')}
- ML Prediction: {metrics.get('ml_prediction', 'N/A')} (Confidence: {metrics.get('ml_confidence', 'N/A')}%)
- Score: {metrics.get('score', 'N/A')}

Provide:
1. A brief summary of the code quality
2. 3-5 specific refactoring suggestions with code examples
3. Best practices for reducing complexity

Format your response in clean markdown."""

        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=os.getenv("GROQ_MODEL"),
            temperature=0.6,
            max_tokens=2000,
        )

        suggestion = response.choices[0].message.content

        # Update the latest analysis record
        try:
            latest = AnalysisRecord.objects.filter(user=request.user).first()
            if latest and not latest.ai_suggestion:
                latest.ai_suggestion = suggestion
                latest.save()
        except Exception:
            pass

        return Response({"suggestion": suggestion, "source": "groq"})

    except Exception as e:
        suggestion = generate_rule_based_suggestions(code, metrics)
        return Response({"suggestion": suggestion, "source": "rule-based", "ai_error": str(e)})


def generate_rule_based_suggestions(code, metrics):
    """Generate rule-based suggestions when AI is not available."""
    suggestions = []
    avg_cc = metrics.get("avg_complexity", 0)
    mi = metrics.get("maintainability_index", 100)
    loc = metrics.get("loc", {})
    ml_pred = metrics.get("ml_prediction", None)

    suggestions.append("## Code Complexity Analysis\n")

    if ml_pred == "High" or avg_cc > 10:
        suggestions.append("### ⚠️ High Complexity Detected\n")
        suggestions.append("- **Break down large functions** into smaller, single-purpose functions (aim for CC ≤ 5 per function)")
        suggestions.append("- **Replace nested conditionals** with early returns or guard clauses")
        suggestions.append("- **Use polymorphism** instead of complex switch/if-elif chains")
        suggestions.append("- **Extract complex boolean expressions** into named variables")
    elif ml_pred == "Medium" or avg_cc > 5:
        suggestions.append("### ⚡ Moderate Complexity\n")
        suggestions.append("- **Consider extracting** helper functions for complex blocks")
        suggestions.append("- **Simplify boolean expressions** using De Morgan's laws")
        suggestions.append("- **Use list comprehensions** or `map()`/`filter()` to replace simple loops")
        suggestions.append("- **Reduce nesting** with early returns and guard clauses")
    else:
        suggestions.append("### ✅ Good Complexity Level\n")
        suggestions.append("- Code complexity is within acceptable range")
        suggestions.append("- **Continue following** single-responsibility principle")
        suggestions.append("- **Keep functions focused** and under 20 lines")

    if mi and mi < 50:
        suggestions.append("\n### 📉 Low Maintainability\n")
        suggestions.append("- Add **docstrings** to all functions and classes")
        suggestions.append("- Improve **variable naming** for clarity")
        suggestions.append("- **Reduce function length** — aim for < 20 lines per function")

    total_lines = loc.get("total_lines", 0)
    comment_lines = loc.get("comment_lines", 0)
    if total_lines > 0 and comment_lines / max(total_lines, 1) < 0.1:
        suggestions.append("\n### 📝 Comments\n")
        suggestions.append("- Code has **less than 10% comments**. Consider adding inline comments for complex logic")

    suggestions.append("\n### 💡 General Tips\n")
    suggestions.append("- Use **type hints** for function parameters and return values")
    suggestions.append("- Follow **PEP 8** style guidelines")
    suggestions.append("- Write **unit tests** for each function")
    suggestions.append("- Apply **SOLID principles** for better architecture")
    suggestions.append("\n> 💡 *Set the `GROQ_API_KEY` environment variable for AI-powered suggestions with code examples*")

    return "\n".join(suggestions)


@api_view(["GET"])
def analysis_history(request):
    """Return the last 20 analysis records."""
    records = AnalysisRecord.objects.filter(user=request.user)[:20]
    data = []
    for rec in records:
        data.append({
            "id": rec.pk,
            "code_snippet": rec.code_snippet[:200] + ("..." if len(rec.code_snippet) > 200 else ""),
            "score": rec.score,
            "metrics": rec.metrics,
            "ai_suggestion": rec.ai_suggestion,
            "created_at": rec.created_at.isoformat(),
        })
    return Response(data)


@api_view(["DELETE"])
def clear_history(request):
    """Clear all analysis history."""
    count, _ = AnalysisRecord.objects.filter(user=request.user).delete()
    return Response({"deleted": count})


@api_view(["POST"])
def chat(request):
    """Handle follow-up questions about the code."""
    code = request.data.get("code", "")
    metrics = request.data.get("metrics", {})
    history = request.data.get("history", [])
    user_message = request.data.get("message", "")

    if not code.strip() or not user_message.strip():
        return Response({"error": "Code and message are required"}, status=status.HTTP_400_BAD_REQUEST)

    # Dynamically load .env
    try:
        from dotenv import load_dotenv
        from core.settings import BASE_DIR
        load_dotenv(BASE_DIR / ".env", override=True)
    except Exception:
        pass

    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        return Response(
            {"error": "GROQ_API_KEY is missing or invalid in .env file. Please add your real key to enable the 'Ask More' Chat feature."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        system_prompt = f"""You are a senior software engineer acting as an interactive coding assistant. 
The user is asking follow-up questions about this {metrics.get('language', 'code')} snippet that was just analyzed:
```
{code[:3000]}
```

Recent Analysis Metrics Provided Context:
- Average Cyclomatic Complexity: {metrics.get('avg_complexity', 'N/A')}
- Maintainability Index: {metrics.get('maintainability_index', 'N/A')} (0-100 score, higher is better)
- Complexity Prediction: {metrics.get('ml_prediction', 'N/A')}

Answer the user's questions clearly, concisely, and provide code examples. Format your response in clean markdown."""

        # Reconstruct the conversation message format for Groq
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            messages=messages,
            model=os.getenv("GROQ_MODEL"),
            temperature=0.6,
            max_tokens=1500,
        )

        return Response({"reply": response.choices[0].message.content, "source": "groq"})

    except Exception as e:
        return Response({"error": f"AI Chat Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
