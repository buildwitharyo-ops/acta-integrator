"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, inputCls, textareaCls } from "@/components/admin/fields";
import { MediaPicker, type MediaItem } from "@/components/admin/MediaPicker";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  archiveSpecDef,
  deleteBrand,
  deleteCategory,
  deleteProductType,
  deleteSpecDef,
  reorderSpecDefs,
  saveBrand,
  saveCategory,
  saveProductType,
  saveSpecDef,
} from "@/lib/actions/admin/categories";

export type CategoryRow = { id: string; name: string; slug: string; description: string | null; sort_order: number; productCount: number };
export type BrandRow = { id: string; name: string; website: string | null; is_authorized_dealer: boolean; logo_media_id: string | null; productCount: number };
export type ProductTypeRow = { id: string; category_id: string; name: string; slug: string; sort_order: number; specCount: number; productCount: number };
export type SpecDefRow = {
  id: string;
  product_type_id: string | null;
  key: string;
  label: string;
  spec_group: string;
  data_type: "number" | "text" | "boolean" | "enum";
  unit: string | null;
  enum_options: string[] | null;
  sort_order: number;
  is_filterable: boolean;
  is_comparable: boolean;
  better_direction: "higher" | "lower" | null;
  is_archived: boolean;
  valueCount: number;
};

const SPEC_GROUPS = [
  "Display", "Optical", "Video", "Audio", "Connectivity", "Network",
  "Performance", "Features", "Hardware", "Components", "Physical",
  "Power", "Protection", "Compatibility", "General",
];
const btnPrimary = "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover disabled:opacity-60";
const btnGhost = "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted";

export function CategoriesManager({
  categories,
  brands,
  productTypes,
  specDefs,
  media,
}: {
  categories: CategoryRow[];
  brands: BrandRow[];
  productTypes: ProductTypeRow[];
  specDefs: SpecDefRow[];
  media: MediaItem[];
}) {
  return (
    <Tabs defaultValue="categories" className="space-y-6">
      <TabsList>
        <TabsTrigger value="categories">Kategori &amp; Brand</TabsTrigger>
        <TabsTrigger value="specs">Product Types &amp; Specs</TabsTrigger>
      </TabsList>
      <TabsContent value="categories">
        <div className="space-y-8">
          <CategorySection categories={categories} />
          <BrandSection brands={brands} media={media} />
        </div>
      </TabsContent>
      <TabsContent value="specs">
        <SpecSection categories={categories} productTypes={productTypes} specDefs={specDefs} />
      </TabsContent>
    </Tabs>
  );
}

// ── Categories ───────────────────────────────────────────────────────────────────────────
function CategorySection({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function onDelete(c: CategoryRow) {
    if (!confirm(`Hapus kategori "${c.name}"?`)) return;
    const res = await deleteCategory(c.id);
    if (res.ok) { toast.success("Kategori dihapus."); router.refresh(); } else toast.error(res.error);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Kategori ({categories.length})</h2>
        <button type="button" onClick={() => setEditing("new")} className={btnGhost}><Plus className="h-3.5 w-3.5" /> Kategori</button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">Nama</th><th className="px-4 py-2.5 font-medium">Slug</th><th className="px-4 py-2.5 font-medium">Produk</th><th className="px-4 py-2.5" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.productCount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEditing(c)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onDelete(c)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Kategori baru" : "Edit kategori"}</DialogTitle></DialogHeader>
          {editing !== null ? (
            <CategoryForm
              row={editing === "new" ? null : editing}
              busy={busy}
              onSubmit={async (payload) => {
                setBusy(true);
                const res = await saveCategory(payload);
                setBusy(false);
                if (res.ok) { toast.success("Kategori tersimpan."); setEditing(null); router.refresh(); } else toast.error(res.error);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CategoryForm({ row, busy, onSubmit }: { row: CategoryRow | null; busy: boolean; onSubmit: (p: unknown) => void }) {
  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(row?.sort_order ?? 0));
  return (
    <div className="space-y-4">
      <Field label="Nama" required><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Deskripsi singkat"><textarea rows={2} className={textareaCls} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field label="Urutan"><input type="number" className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></Field>
      <DialogFooter>
        <button type="button" disabled={busy} className={btnPrimary} onClick={() => onSubmit({ id: row?.id ?? null, name, description, sort_order: sortOrder })}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </DialogFooter>
    </div>
  );
}

// ── Brands ───────────────────────────────────────────────────────────────────────────────
function BrandSection({ brands, media }: { brands: BrandRow[]; media: MediaItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<BrandRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function onDelete(b: BrandRow) {
    if (!confirm(`Hapus brand "${b.name}"?`)) return;
    const res = await deleteBrand(b.id);
    if (res.ok) { toast.success("Brand dihapus."); router.refresh(); } else toast.error(res.error);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Brand ({brands.length})</h2>
        <button type="button" onClick={() => setEditing("new")} className={btnGhost}><Plus className="h-3.5 w-3.5" /> Brand</button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">Nama</th><th className="px-4 py-2.5 font-medium">Authorized</th><th className="px-4 py-2.5 font-medium">Produk</th><th className="px-4 py-2.5" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{b.name}</td>
                <td className="px-4 py-2.5">{b.is_authorized_dealer ? <span className="inline-flex items-center gap-1 text-xs text-accent-text"><Star className="h-3 w-3" /> Dealer</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.productCount}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEditing(b)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onDelete(b)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Brand baru" : "Edit brand"}</DialogTitle></DialogHeader>
          {editing !== null ? (
            <BrandForm
              row={editing === "new" ? null : editing}
              media={media}
              busy={busy}
              onSubmit={async (payload) => {
                setBusy(true);
                const res = await saveBrand(payload);
                setBusy(false);
                if (res.ok) { toast.success("Brand tersimpan."); setEditing(null); router.refresh(); } else toast.error(res.error);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function BrandForm({ row, media, busy, onSubmit }: { row: BrandRow | null; media: MediaItem[]; busy: boolean; onSubmit: (p: unknown) => void }) {
  const [name, setName] = useState(row?.name ?? "");
  const [website, setWebsite] = useState(row?.website ?? "");
  const [dealer, setDealer] = useState(row?.is_authorized_dealer ?? false);
  const [logo, setLogo] = useState<string | null>(row?.logo_media_id ?? null);
  return (
    <div className="space-y-4">
      <Field label="Nama" required><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Website" hint="URL lengkap (https://…)"><input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} /></Field>
      <Field label="Logo"><MediaPicker media={media} value={logo} onChange={setLogo} /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={dealer} onChange={(e) => setDealer(e.target.checked)} className="h-4 w-4 rounded border-border" />
        Authorized dealer
      </label>
      <DialogFooter>
        <button type="button" disabled={busy} className={btnPrimary} onClick={() => onSubmit({ id: row?.id ?? null, name, website, is_authorized_dealer: dealer, logo_media_id: logo ?? "" })}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </DialogFooter>
    </div>
  );
}

// ── Spec definitions (per Product Type, which is a sub-classification of Category) ────────
function SpecSection({ categories, productTypes, specDefs }: { categories: CategoryRow[]; productTypes: ProductTypeRow[]; specDefs: SpecDefRow[] }) {
  const [catId, setCatId] = useState(categories[0]?.id ?? "");
  const typesInCategory = productTypes.filter((t) => t.category_id === catId).sort((a, b) => a.sort_order - b.sort_order);
  const [typeId, setTypeId] = useState(typesInCategory[0]?.id ?? "");

  // If the selected type was deleted (or a category switch left it stale), fall back to the first
  // type in the current list rather than pointing at a now-nonexistent product_type_id.
  useEffect(() => {
    if (typeId && !typesInCategory.some((t) => t.id === typeId)) {
      setTypeId(typesInCategory[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesInCategory.map((t) => t.id).join(","), typeId]);

  function onCategoryChange(id: string) {
    setCatId(id);
    const first = productTypes.filter((t) => t.category_id === id).sort((a, b) => a.sort_order - b.sort_order)[0];
    setTypeId(first?.id ?? "");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Kategori:</label>
        <select className={inputCls + " w-auto"} value={catId} onChange={(e) => onCategoryChange(e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <ProductTypeManager
        categoryId={catId}
        types={typesInCategory}
        selectedTypeId={typeId}
        onSelectType={setTypeId}
      />

      {typeId ? (
        <SpecDefSection typeId={typeId} typeName={typesInCategory.find((t) => t.id === typeId)?.name ?? ""} specDefs={specDefs} />
      ) : (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Belum ada Product Type di kategori ini — tambah satu dulu untuk mengelola spec field-nya.
        </p>
      )}
    </div>
  );
}

// ── Product Types (Category → Product Type) ────────────────────────────────────────────────
function ProductTypeManager({
  categoryId,
  types,
  selectedTypeId,
  onSelectType,
}: {
  categoryId: string;
  types: ProductTypeRow[];
  selectedTypeId: string;
  onSelectType: (id: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ProductTypeRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  async function move(i: number, dir: -1 | 1) {
    if (busy) return; // guards against an overlapping click racing a swap already in flight
    const j = i + dir;
    if (j < 0 || j >= types.length) return;
    const a = types[i]!, b = types[j]!;
    setBusy(true);
    const [r1, r2] = await Promise.all([
      saveProductType({ id: a.id, category_id: a.category_id, name: a.name, sort_order: b.sort_order }),
      saveProductType({ id: b.id, category_id: b.category_id, name: b.name, sort_order: a.sort_order }),
    ]);
    setBusy(false);
    // Refresh unconditionally — a partial failure still writes one side, so always show the real
    // DB state rather than a stale list that would hide that one row already changed.
    router.refresh();
    if (!r1.ok || !r2.ok) toast.error(!r1.ok ? r1.error : !r2.ok ? r2.error : "Gagal mengurutkan.");
  }
  async function onDelete(t: ProductTypeRow) {
    if (!confirm(`Hapus product type "${t.name}"?`)) return;
    const res = await deleteProductType(t.id);
    if (res.ok) { toast.success("Product type dihapus."); router.refresh(); } else toast.error(res.error);
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Product Types ({types.length})</h3>
        <button type="button" onClick={() => setEditing("new")} disabled={!categoryId} className={btnGhost}><Plus className="h-3.5 w-3.5" /> Product Type</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {types.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              "group flex items-center gap-1 rounded-full border px-1 py-0.5 pl-3 text-sm transition-colors",
              t.id === selectedTypeId ? "border-primary bg-primary/10 text-accent-text" : "border-border hover:bg-muted",
            )}
          >
            <button type="button" onClick={() => onSelectType(t.id)} className="py-1">
              {t.name} <span className="text-xs text-muted-foreground">({t.specCount})</span>
            </button>
            <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={busy || i === types.length - 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
            <button type="button" onClick={() => setEditing(t)} className="rounded p-1 text-muted-foreground hover:bg-muted"><Pencil className="h-3 w-3" /></button>
            <button type="button" onClick={() => onDelete(t)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
        {types.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada product type.</p> : null}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Product Type baru" : "Edit Product Type"}</DialogTitle></DialogHeader>
          {editing !== null ? (
            <ProductTypeForm
              row={editing === "new" ? null : editing}
              categoryId={categoryId}
              nextSort={types.reduce((max, t) => Math.max(max, t.sort_order), -1) + 1}
              busy={busy}
              onSubmit={async (payload) => {
                setBusy(true);
                const res = await saveProductType(payload);
                setBusy(false);
                if (res.ok) {
                  toast.success("Product type tersimpan.");
                  setEditing(null);
                  if (res.id) onSelectType(res.id);
                  router.refresh();
                } else toast.error(res.error);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ProductTypeForm({ row, categoryId, nextSort, busy, onSubmit }: { row: ProductTypeRow | null; categoryId: string; nextSort: number; busy: boolean; onSubmit: (p: unknown) => void }) {
  const [name, setName] = useState(row?.name ?? "");
  return (
    <div className="space-y-4">
      <Field label="Nama" required hint="mis. Interactive Flat Panel (IFP)"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <DialogFooter>
        <button type="button" disabled={busy || !name.trim()} className={btnPrimary} onClick={() => onSubmit({ id: row?.id ?? null, category_id: categoryId, name, sort_order: row?.sort_order ?? nextSort })}>
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </DialogFooter>
    </div>
  );
}

// ── Spec definitions for one Product Type ──────────────────────────────────────────────────
function SpecDefSection({ typeId, typeName, specDefs }: { typeId: string; typeName: string; specDefs: SpecDefRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SpecDefRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const defs = specDefs.filter((d) => d.product_type_id === typeId).sort((a, b) => a.sort_order - b.sort_order);

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= defs.length) return;
    const ids = defs.map((d) => d.id);
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    const res = await reorderSpecDefs(ids);
    if (res.ok) router.refresh(); else toast.error(res.error);
  }
  async function onArchive(d: SpecDefRow) {
    const res = await archiveSpecDef(d.id, !d.is_archived);
    if (res.ok) { toast.success(d.is_archived ? "Definition dipulihkan." : "Definition diarsipkan."); router.refresh(); } else toast.error(res.error);
  }
  async function onDelete(d: SpecDefRow) {
    if (!confirm(`Hapus permanen "${d.label}"? (hanya bila belum ada nilai)`)) return;
    const res = await deleteSpecDef(d.id);
    if (res.ok) { toast.success("Definition dihapus."); router.refresh(); } else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Spec fields — {typeName}</h3>
        <button type="button" onClick={() => setEditing("new")} className={btnGhost}><Plus className="h-3.5 w-3.5" /> Definition</button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Urut</th><th className="px-3 py-2.5 font-medium">Label / key</th>
              <th className="px-3 py-2.5 font-medium">Group</th><th className="px-3 py-2.5 font-medium">Tipe</th>
              <th className="px-3 py-2.5 font-medium">Filter/Compare</th><th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {defs.map((d, i) => (
              <tr key={d.id} className={d.is_archived ? "bg-muted/20 text-muted-foreground" : "hover:bg-muted/30"}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || d.is_archived} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === defs.length - 1 || d.is_archived} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{d.label} {d.is_archived ? <span className="ml-1 rounded bg-destructive/10 px-1 text-[10px] text-destructive">archived</span> : null}</div>
                  <div className="text-xs text-muted-foreground">{d.key}{d.valueCount ? ` · ${d.valueCount} nilai` : ""}</div>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{d.spec_group}</td>
                <td className="px-3 py-2 text-muted-foreground">{d.data_type}{d.unit ? ` (${d.unit})` : ""}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{d.is_filterable ? "filter" : "—"} / {d.is_comparable ? "compare" : "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setEditing(d)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onArchive(d)} className="rounded p-1.5 text-muted-foreground hover:bg-muted" title={d.is_archived ? "Pulihkan" : "Arsipkan"}>
                      {d.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => onDelete(d)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Hapus permanen"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {defs.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">Belum ada spec definition untuk product type ini.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing === "new" ? "Spec definition baru" : "Edit spec definition"}</DialogTitle></DialogHeader>
          {editing !== null ? (
            <SpecDefForm
              row={editing === "new" ? null : editing}
              productTypeId={typeId}
              nextSort={defs.reduce((max, d) => Math.max(max, d.sort_order), -1) + 1}
              busy={busy}
              onSubmit={async (payload) => {
                setBusy(true);
                const res = await saveSpecDef(payload);
                setBusy(false);
                if (res.ok) { toast.success("Definition tersimpan."); setEditing(null); router.refresh(); } else toast.error(res.error);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SpecDefForm({ row, productTypeId, nextSort, busy, onSubmit }: { row: SpecDefRow | null; productTypeId: string; nextSort: number; busy: boolean; onSubmit: (p: unknown) => void }) {
  const isEdit = row !== null;
  const lockType = isEdit && row!.valueCount > 0;
  const [key, setKey] = useState(row?.key ?? "");
  const [label, setLabel] = useState(row?.label ?? "");
  const [group, setGroup] = useState(row?.spec_group ?? SPEC_GROUPS[0]);
  const [dataType, setDataType] = useState<SpecDefRow["data_type"]>(row?.data_type ?? "text");
  const [unit, setUnit] = useState(row?.unit ?? "");
  const [enumOptions, setEnumOptions] = useState((row?.enum_options ?? []).join("\n"));
  const [filterable, setFilterable] = useState(row?.is_filterable ?? false);
  const [comparable, setComparable] = useState(row?.is_comparable ?? true);
  const [better, setBetter] = useState<"" | "higher" | "lower">(row?.better_direction ?? "");

  return (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <Field label="Key (snake_case)" required hint={isEdit ? "Immutable — salah ketik? archive lalu buat baru." : "Identifier permanen, mis. max_spl."}>
        <input className={inputCls} value={key} disabled={isEdit} onChange={(e) => setKey(e.target.value)} />
      </Field>
      <Field label="Label" required><input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Spec group" required>
          <input className={inputCls} list="spec-groups" value={group} onChange={(e) => setGroup(e.target.value)} />
          <datalist id="spec-groups">{SPEC_GROUPS.map((g) => <option key={g} value={g} />)}</datalist>
        </Field>
        <Field label="Data type" required hint={lockType ? "Terkunci — sudah ada nilai." : undefined}>
          <select className={inputCls} value={dataType} disabled={lockType} onChange={(e) => setDataType(e.target.value as SpecDefRow["data_type"])}>
            <option value="text">text</option><option value="number">number</option><option value="boolean">boolean</option><option value="enum">enum</option>
          </select>
        </Field>
      </div>
      {dataType === "number" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit" hint="mis. dB, nit, mm, W"><input className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)} /></Field>
          <Field label="Better direction" hint="Penanda unggul di compare">
            <select className={inputCls} value={better} onChange={(e) => setBetter(e.target.value as "" | "higher" | "lower")}>
              <option value="">netral</option><option value="higher">higher (makin besar makin baik)</option><option value="lower">lower (makin kecil makin baik)</option>
            </select>
          </Field>
        </div>
      ) : null}
      {dataType === "enum" ? (
        <Field label="Enum options" required hint="Satu opsi per baris.">
          <textarea rows={4} className={textareaCls} value={enumOptions} onChange={(e) => setEnumOptions(e.target.value)} />
        </Field>
      ) : null}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filterable} onChange={(e) => setFilterable(e.target.checked)} className="h-4 w-4 rounded border-border" /> Filterable (grid)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={comparable} onChange={(e) => setComparable(e.target.checked)} className="h-4 w-4 rounded border-border" /> Comparable (tabel bandingkan)</label>
      </div>
      <DialogFooter>
        <button
          type="button"
          disabled={busy}
          className={btnPrimary}
          onClick={() =>
            onSubmit({
              id: row?.id ?? null,
              product_type_id: productTypeId,
              key,
              label,
              spec_group: group,
              data_type: dataType,
              unit,
              enum_options: enumOptions.split("\n").map((s) => s.trim()).filter(Boolean),
              sort_order: row?.sort_order ?? nextSort,
              is_filterable: filterable,
              is_comparable: comparable,
              better_direction: dataType === "number" && better ? better : null,
            })
          }
        >
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </DialogFooter>
    </div>
  );
}
