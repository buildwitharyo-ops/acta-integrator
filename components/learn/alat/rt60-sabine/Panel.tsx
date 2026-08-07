"use client";

/**
 * Lapisan interaktif kalkulator RT60 — KOLOM ISIAN SAJA (03-UI §12.1).
 *
 * Panel ini dipasang sebagai `children` dari `<WidgetShell>`, artinya ia hidup
 * di dalam `<form method="GET">` milik shell. Setiap kolom adalah `<input>` /
 * `<select>` sungguhan dengan atribut `name`, jadi:
 *
 *   - Tanpa JavaScript: React tetap merender atribut `value` ke HTML server,
 *     tombol Hitung mengirim form secara native, server menghitung ulang, dan
 *     hasil lengkap muncul. Ini jalur utama, bukan cadangan (§12.6).
 *   - Dengan JavaScript: URL disinkronkan memakai `history.replaceState`,
 *     TIDAK PERNAH `router.push` — satu permintaan RSC per ketikan akan
 *     menghancurkan INP (§12.1).
 *
 * Wilayah hasil yang berwibawa tetap milik server. Yang dirender di sini hanya
 * pratinjau ringkas yang ditunda 350 ms, dan hanya setelah pengguna benar-benar
 * mengubah sesuatu — supaya angka server tidak pernah punya kembaran yang
 * berbeda di layar saat halaman baru dimuat.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NumberField } from "@/components/learn/alat/_shared/NumberField";
import { SelectField } from "@/components/learn/alat/_shared/SelectField";
import { fmt } from "@/lib/learn/format";
import { cn } from "@/lib/utils";
import {
  CEILING_MATERIALS,
  FLOOR_MATERIALS,
  ROOM_TARGETS,
  ROOM_TYPE_IDS,
  RT60_DEFAULT_INPUT,
  RT60_LIMITS,
  RT60_TOOL_SLUG,
  WALL_MATERIALS,
  computeRt60,
  isCeilingId,
  isFloorId,
  isRoomTypeId,
  isWallId,
  sanitiseRt60Input,
  toSelectOptions,
  type Rt60Input,
  type Rt60InputLike,
} from "./calc";
import { ROOM_TYPE_LABEL, RT60_COPY } from "./copy.id";
import { RT60_PARAM, RT60_TOOL_PATH, rt60Href } from "./params";

/** Cukup lama untuk tidak menulis URL per karakter, cukup pendek untuk terasa
 *  langsung. Satu penunda dipakai bersama oleh sinkronisasi URL dan pratinjau. */
const URL_SYNC_DELAY_MS = 350;

const FLOOR_OPTIONS = toSelectOptions(FLOOR_MATERIALS);
const WALL_OPTIONS = toSelectOptions(WALL_MATERIALS);
const CEILING_OPTIONS = toSelectOptions(CEILING_MATERIALS);
const ROOM_OPTIONS = ROOM_TYPE_IDS.map((id) => ({
  value: id,
  label: `${ROOM_TYPE_LABEL[id]} — target ${fmt(ROOM_TARGETS[id].target)} detik`,
}));

type NumericField = "length" | "width" | "height" | "windowArea" | "people";

/** Penerapan eksplisit dan lengkap: tanpa kunci terhitung, tanpa `as`. */
function withNumber(
  current: Rt60Input,
  field: NumericField,
  value: number,
): Rt60Input {
  switch (field) {
    case "length":
      return { ...current, length: value };
    case "width":
      return { ...current, width: value };
    case "height":
      return { ...current, height: value };
    case "windowArea":
      return { ...current, windowArea: value };
    case "people":
      return { ...current, people: value };
  }
}

export type Rt60PanelProps = {
  /** Nilai awal — biasanya hasil `parseRt60Params(searchParams)` di server. */
  initial?: Rt60InputLike;
  /** Lintasan telanjang alat, dipakai saat menulis ulang URL. */
  action?: string;
  /** Tampilkan pratinjau sisi klien setelah pengguna mengubah nilai. */
  preview?: boolean;
  className?: string;
};

export function Rt60Panel({
  initial,
  action = RT60_TOOL_PATH,
  preview = true,
  className,
}: Rt60PanelProps) {
  const seed = useMemo(() => sanitiseRt60Input(initial), [initial]);
  const [input, setInput] = useState<Rt60Input>(seed);
  const [committed, setCommitted] = useState<Rt60Input>(seed);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setNumber = useCallback((field: NumericField, value: number | null) => {
    if (value === null || !Number.isFinite(value)) return;
    setDirty(true);
    setInput((current) => withNumber(current, field, value));
  }, []);

  const setChoice = useCallback((patch: Partial<Rt60Input>) => {
    setDirty(true);
    setInput((current) => ({ ...current, ...patch }));
  }, []);

  // Satu penunda untuk dua pekerjaan: menulis URL dan menghitung pratinjau.
  // Pembersihan efeknya yang menjadi mekanisme debounce.
  useEffect(() => {
    if (!dirty) return;
    timer.current = setTimeout(() => {
      setCommitted(input);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", rt60Href(input, action));
      }
    }, URL_SYNC_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [action, dirty, input]);

  const result = useMemo(
    () => (dirty && preview ? computeRt60(committed) : null),
    [committed, dirty, preview],
  );

  return (
    <div data-learn-calc={RT60_TOOL_SLUG} className={cn("space-y-5", className)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          name={RT60_PARAM.length}
          label={RT60_COPY.field.length.label}
          unit={RT60_COPY.field.length.unit}
          hint={RT60_COPY.field.length.hint}
          value={input.length}
          onValueChange={(value) => setNumber("length", value)}
          min={RT60_LIMITS.length.min}
          max={RT60_LIMITS.length.max}
          decimals={RT60_LIMITS.length.decimals}
        />
        <NumberField
          name={RT60_PARAM.width}
          label={RT60_COPY.field.width.label}
          unit={RT60_COPY.field.width.unit}
          hint={RT60_COPY.field.width.hint}
          value={input.width}
          onValueChange={(value) => setNumber("width", value)}
          min={RT60_LIMITS.width.min}
          max={RT60_LIMITS.width.max}
          decimals={RT60_LIMITS.width.decimals}
        />
      </div>

      <NumberField
        name={RT60_PARAM.height}
        label={RT60_COPY.field.height.label}
        unit={RT60_COPY.field.height.unit}
        hint={RT60_COPY.field.height.hint}
        value={input.height}
        onValueChange={(value) => setNumber("height", value)}
        min={RT60_LIMITS.height.min}
        max={RT60_LIMITS.height.max}
        decimals={RT60_LIMITS.height.decimals}
      />

      <SelectField
        name={RT60_PARAM.floor}
        label={RT60_COPY.field.floor.label}
        options={FLOOR_OPTIONS}
        value={input.floor}
        onValueChange={(value) =>
          setChoice({
            floor: isFloorId(value) ? value : RT60_DEFAULT_INPUT.floor,
          })
        }
      />

      <SelectField
        name={RT60_PARAM.wall}
        label={RT60_COPY.field.wall.label}
        options={WALL_OPTIONS}
        value={input.wall}
        onValueChange={(value) =>
          setChoice({ wall: isWallId(value) ? value : RT60_DEFAULT_INPUT.wall })
        }
      />

      <SelectField
        name={RT60_PARAM.ceiling}
        label={RT60_COPY.field.ceiling.label}
        options={CEILING_OPTIONS}
        value={input.ceiling}
        onValueChange={(value) =>
          setChoice({
            ceiling: isCeilingId(value) ? value : RT60_DEFAULT_INPUT.ceiling,
          })
        }
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          name={RT60_PARAM.windowArea}
          label={RT60_COPY.field.windowArea.label}
          unit={RT60_COPY.field.windowArea.unit}
          hint={RT60_COPY.field.windowArea.hint}
          value={input.windowArea}
          onValueChange={(value) => setNumber("windowArea", value)}
          min={RT60_LIMITS.windowArea.min}
          max={RT60_LIMITS.windowArea.max}
          decimals={RT60_LIMITS.windowArea.decimals}
        />
        <NumberField
          name={RT60_PARAM.people}
          label={RT60_COPY.field.people.label}
          unit={RT60_COPY.field.people.unit}
          hint={RT60_COPY.field.people.hint}
          value={input.people}
          onValueChange={(value) => setNumber("people", value)}
          min={RT60_LIMITS.people.min}
          max={RT60_LIMITS.people.max}
          decimals={RT60_LIMITS.people.decimals}
        />
      </div>

      <SelectField
        name={RT60_PARAM.room}
        label={RT60_COPY.field.room.label}
        hint={RT60_COPY.field.room.hint}
        options={ROOM_OPTIONS}
        value={input.room}
        onValueChange={(value) =>
          setChoice({ room: isRoomTypeId(value) ? value : RT60_DEFAULT_INPUT.room })
        }
      />

      {result ? (
        <div
          role="status"
          className="rounded-sm border border-border bg-background px-3 py-3"
        >
          <p className="mono-label text-muted-foreground">
            {RT60_COPY.panel.previewLabel}
          </p>
          <p className="mt-2 font-mono text-[0.9375rem] leading-[1.4] tabular-nums text-foreground">
            {RT60_COPY.panel.previewValue({
              tMid: fmt(result.tMid),
              target: fmt(result.treatment.targetRt60),
            })}
          </p>
          <p className="caption mt-2 text-muted-foreground">
            {RT60_COPY.panel.previewHint}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default Rt60Panel;
