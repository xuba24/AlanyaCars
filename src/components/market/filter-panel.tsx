"use client";

import {
  Banknote,
  Car,
  Calendar,
  ClipboardCheck,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrimaryButton } from "@/components/market/primary-button";

type Make = { id: string; name: string; slug: string };
type Model = { id: string; name: string; slug: string; makeId: string };

type FilterPanelProps = {
  dealType: string;
  makeId: string;
  modelId: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  city: string;
  registration: string;
  makes: Make[];
  models: Model[];
  total: number;
  onParamChange: (key: string, value: string) => void;
  onReset: () => void;
  onApply?: () => void;
};

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: typeof SlidersHorizontal;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

export function FilterPanel({
  dealType,
  makeId,
  modelId,
  yearFrom,
  yearTo,
  priceFrom,
  priceTo,
  city,
  registration,
  makes,
  models,
  total,
  onParamChange,
  onReset,
  onApply,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SectionTitle icon={SlidersHorizontal} label="Сделка" />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-2 text-sm transition ${
              dealType === "SALE"
                ? "border-transparent bg-primary text-primary-foreground"
                : "hover:bg-muted/40"
            }`}
            onClick={() => onParamChange("dealType", "SALE")}
          >
            Продажа
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-2 text-sm transition ${
              dealType === "RENT"
                ? "border-transparent bg-primary text-primary-foreground"
                : "hover:bg-muted/40"
            }`}
            onClick={() => onParamChange("dealType", "RENT")}
          >
            Аренда
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle icon={Car} label="Марка и модель" />
        <div>
          <div className="text-sm font-medium">Марка</div>
          <Select
            value={makeId || "__"}
            onValueChange={(v) => onParamChange("makeId", v === "__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбрать марку" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Любая</SelectItem>
              {makes.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-sm font-medium">Модель</div>
          <Select
            value={modelId || "__"}
            onValueChange={(v) => onParamChange("modelId", v === "__" ? "" : v)}
            disabled={!makeId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбрать модель" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Любая</SelectItem>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle icon={Calendar} label="Год выпуска" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-sm font-medium">Год от</div>
            <Input
              inputMode="numeric"
              value={yearFrom}
              onChange={(e) => onParamChange("yearFrom", e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm font-medium">Год до</div>
            <Input
              inputMode="numeric"
              value={yearTo}
              onChange={(e) => onParamChange("yearTo", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle icon={Banknote} label="Цена" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-sm font-medium">Цена от</div>
            <Input
              inputMode="numeric"
              value={priceFrom}
              onChange={(e) => onParamChange("priceFrom", e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm font-medium">Цена до</div>
            <Input
              inputMode="numeric"
              value={priceTo}
              onChange={(e) => onParamChange("priceTo", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle icon={MapPin} label="Город" />
        <div>
          <Input value={city} onChange={(e) => onParamChange("city", e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle icon={ClipboardCheck} label="Учет" />
        <div>
          <Select
            value={registration || "__"}
            onValueChange={(v) => onParamChange("registration", v === "__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбери" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Не указано</SelectItem>
              <SelectItem value="NOT_CLEARED">Не растаможен</SelectItem>
              <SelectItem value="RF">RF</SelectItem>
              <SelectItem value="RSO">RSO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 border-t bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onReset}>
            Сброс
          </Button>
          <PrimaryButton className="flex-1" onClick={onApply}>
            Показать {total.toLocaleString()}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
