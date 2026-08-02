"use client";
import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeLotSize } from "@/lib/utils/pip-value";

type Props = {
  paire: string;
  onLotSize?: (lots: number) => void;
  defaultCapital?: number;
};

/**
 * Calculatrice de taille de position.
 * Formule : risqueUsd = capital * (risque%/100)
 *          lots = risqueUsd / (slPips * pipValue(paire))
 */
export function PositionCalculator({ paire, onLotSize, defaultCapital = 10000 }: Props) {
  const [capital, setCapital] = useState<number>(defaultCapital);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [slPips, setSlPips] = useState<number>(20);

  const riskUsd = useMemo(() => (capital * riskPct) / 100, [capital, riskPct]);
  const lots = useMemo(() => computeLotSize(paire, riskUsd, slPips), [paire, riskUsd, slPips]);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4" /> Calculatrice de position — {paire || "—"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="space-y-1">
          <Label>Capital ($)</Label>
          <Input type="number" min={0} value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Risque (%)</Label>
          <Input type="number" step="any" min={0} value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>SL (pips/points)</Label>
          <Input type="number" step="any" min={0} value={slPips} onChange={(e) => setSlPips(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Risque $</Label>
          <Input readOnly value={riskUsd.toFixed(2)} className="bg-muted" />
        </div>
        <div className="space-y-1">
          <Label>Taille (lots)</Label>
          <div className="flex gap-2">
            <Input readOnly value={lots.toFixed(2)} className="bg-muted font-semibold" />
            {onLotSize && (
              <button
                type="button"
                onClick={() => onLotSize(Number(lots.toFixed(2)))}
                className="rounded-md bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
              >
                ↓ Utiliser
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
