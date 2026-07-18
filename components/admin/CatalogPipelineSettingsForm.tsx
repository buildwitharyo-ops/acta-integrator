"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCatalogPipelineSettings } from "@/lib/actions/admin/catalog-pipeline";
import { inputCls } from "@/components/admin/fields";

export function CatalogPipelineSettingsForm({
  initial,
}: {
  initial: { auto_publish_min_confidence: string; auto_publish_require_recommendation: boolean };
}) {
  const router = useRouter();
  const [minConfidence, setMinConfidence] = useState(initial.auto_publish_min_confidence);
  const [requireRecommendation, setRequireRecommendation] = useState(initial.auto_publish_require_recommendation);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    const res = await saveCatalogPipelineSettings({
      auto_publish_min_confidence: minConfidence,
      auto_publish_require_recommendation: requireRecommendation,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Threshold bulk-approve disimpan.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Confidence minimum</label>
        <select className={inputCls} value={minConfidence} onChange={(e) => setMinConfidence(e.target.value)}>
          <option value="tinggi">Tinggi saja (paling ketat)</option>
          <option value="sedang">Tinggi atau sedang</option>
          <option value="rendah">Semua confidence</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={requireRecommendation} onChange={(e) => setRequireRecommendation(e.target.checked)} />
        Wajib rekomendasi AI = &quot;publish&quot;
      </label>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="h-9 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {saving ? "Menyimpan…" : "Simpan"}
      </button>
    </div>
  );
}
