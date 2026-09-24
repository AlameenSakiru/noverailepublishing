"use client";

import React, { useState } from "react";
import { FolderPlus, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryManagerClientProps {
  categories: any[];
}

export function CategoryManagerClient({ categories }: CategoryManagerClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          parentId: parentId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create category.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setName("");
      setSlug("");
      setDescription("");
      setParentId("");
      router.refresh();
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error creating category.");
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Category Creation Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h2 className="font-serif text-lg font-bold text-brand-ink mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-brand-500" />
          <span>Add New Category</span>
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Category successfully created!</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Health & Nutrition"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">URL Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Parent Category</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">None (Top-Level Category)</option>
              {categories
                .filter((c) => !c.parentId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Category overview..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-ink text-white font-semibold rounded-lg hover:bg-brand-900 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Save Category"}
          </button>
        </form>
      </div>

      {/* Categories Hierarchy Table */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-brand-ink">Existing Categories</h2>
          <span className="text-xs text-gray-400">{categories.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="p-3.5">Category Name</th>
                <th className="p-3.5">Slug</th>
                <th className="p-3.5">Parent</th>
                <th className="p-3.5 text-right">Books</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50">
                  <td className="p-3.5 font-bold text-brand-ink">
                    {cat.parent ? `↳ ${cat.name}` : cat.name}
                  </td>
                  <td className="p-3.5 font-mono text-gray-500">{cat.slug}</td>
                  <td className="p-3.5 text-gray-500">{cat.parent?.name || "Top-Level"}</td>
                  <td className="p-3.5 text-right font-semibold text-brand-ink">
                    {cat._count.books}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
