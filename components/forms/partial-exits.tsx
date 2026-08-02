"use client";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PartialExit } from "@/types/database";

type Props = {
  value: PartialExit[];
  onChange: (exits: PartialExit[]) => void;
};

/** Éditeur de sorties partielles (TP1, TP2, ...). Renvoie le R pondéré cumulé en info. */
export function PartialExitsEditor({ value, onChange }: Props) {
  const totalPct = value.reduce((s, e) => s + (e.pct || 0), 0);
  const weightedR = value.reduce((s, e) => s + ((e.r_partial || 0) * (e.pct || 0) / 100), 0);

  function add() {
    onChange([...value, { price: 0, pct: 0, r_partial: 0 }]);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function update(idx: number, field: keyof PartialExit, val: number) {
    onChange(value.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm">Sorties partielles (optionnel)</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3 w-3" /> Ajouter</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground">Ajoute des TP1/TP2/... si tu clôtures en plusieurs fois. Sinon laisse vide.</p>
        )}
        {value.map((exit, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 rounded-md border p-2">
            <div className="col-span-1 flex items-center text-xs font-semibold text-muted-foreground">TP{i + 1}</div>
            <div className="col-span-4 space-y-1">
              <Label className="text-[10px]">Prix</Label>
              <Input type="number" step="any" value={exit.price} onChange={(e) => update(i, "price", Number(e.target.value))} className="h-8" />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-[10px]">% clôturé</Label>
              <Input type="number" step="1" min={0} max={100} value={exit.pct} onChange={(e) => update(i, "pct", Number(e.target.value))} className="h-8" />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-[10px]">R sur cette portion</Label>
              <Input type="number" step="0.01" value={exit.r_partial} onChange={(e) => update(i, "r_partial", Number(e.target.value))} className="h-8" />
            </div>
            <div className="col-span-1 flex items-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8"><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {value.length > 0 && (
          <div className="flex items-center justify-between rounded-md bg-muted/40 p-2 text-xs">
            <span>Total clôturé : <strong className={totalPct === 100 ? "text-emerald-400" : "text-amber-400"}>{totalPct}%</strong></span>
            <span>R pondéré : <strong className={weightedR >= 0 ? "text-emerald-400" : "text-rose-400"}>{weightedR >= 0 ? "+" : ""}{weightedR.toFixed(2)}</strong></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
