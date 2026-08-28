from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FinancialHealthInput:
    liquidity_score: int
    profitability_score: int
    growth_score: int
    working_capital_score: int
    forecast_risk_score: int
    data_confidence_score: int


class FinancialEngine:
    def calculate_financial_health(self, payload: FinancialHealthInput) -> dict[str, object]:
        components = {
            "cash": payload.liquidity_score,
            "margin": payload.profitability_score,
            "growth": payload.growth_score,
            "workingCapital": payload.working_capital_score,
            "risk": payload.forecast_risk_score,
            "dataConfidence": payload.data_confidence_score,
        }
        score = round(sum(components.values()) / len(components))
        return {
            "score": score,
            "components": components,
            "explanation": (
                "Financial Health is calculated by the backend financial engine from configured "
                "components. The LLM may explain this score but must not invent it."
            ),
        }

    def compare_scenario(self, assumptions: dict[str, float | int | str | bool]) -> dict[str, object]:
        return {
            "assumptions": assumptions,
            "status": "unavailable",
            "message": "Scenario inputs must be connected to configured tenant metrics before calculation.",
        }


financial_engine = FinancialEngine()
