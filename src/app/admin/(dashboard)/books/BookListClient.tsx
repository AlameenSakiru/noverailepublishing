"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  BookOpen,
  ExternalLink,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  Users,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { CreateBookModal } from "./CreateBookModal";
import { EditBookModal, BookToEdit } from "./EditBookModal";

interface BookListClientProps {
  books: any[];
  categories: any[];
  authors: any[];
  imprints: any[];
}

export function BookListClient({
  books: initialBooks,
  categories,
  authors,
  imprints,
}: BookListClientProps) {
  const searchParams = useSearchParams();

  // Local state for instant UI updates upon edit/delete
  const [books, setBooks] = useState<any[]>(initialBooks);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookToEdit | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Keep local books in sync if server revalidates
  useEffect(() => {
    setBooks(initialBooks);
  }, [initialBooks]);

  // Handle URL ?edit=[bookId]
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      const match = books.find((b) => b.id === editId);
      if (match) {
        setEditingBook(match);
        setEditModalOpen(true);
      }
    }
  }, [searchParams, books]);

  const handleEditClick = (book: any) => {
    setEditingBook(book);
    setEditModalOpen(true);
  };

  const handleBookUpdated = (updatedBook: any) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === updatedBook.id ? { ...b, ...updatedBook } : b))
    );
  };

  const handleBookDeleted = (deletedBookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== deletedBookId));
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Status filter
      if (statusFilter !== "ALL" && book.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "ALL" && book.categoryId !== categoryFilter) {
        return false;
      }
      // Search query (title, author, isbn, acronym)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = book.title?.toLowerCase().includes(q);
        const matchesAuthor = book.author?.name?.toLowerCase().includes(q);
        const matchesCategory = book.category?.name?.toLowerCase().includes(q);
        const matchesIsbn = book.isbn?.toLowerCase().includes(q);
        const matchesAcronym = book.examMetadata?.examAcronym?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesCategory && !matchesIsbn && !matchesAcronym) {
          return false;
        }
      }
      return true;
    });
  }, [books, searchQuery, statusFilter, categoryFilter]);

  // Summary Metrics
  const totalCount = books.length;
  const publishedCount = books.filter((b) => b.status === "PUBLISHED").length;
  const draftCount = books.filter((b) => b.status === "DRAFT").length;
  const totalReaders = books.reduce((acc, b) => acc + (b._count?.entitlements || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-ink">
            Digital Book Catalog
          </h1>
          <p className="text-xs text-brand-slate mt-0.5">
            Manage your digital publications, preview pages, metadata, and pricing.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-ink hover:bg-brand-900 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Publication</span>
        </button>
      </div>

      {/* Catalog Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gray-100 text-gray-700">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Total Titles</span>
            <span className="text-base font-bold text-brand-ink font-mono">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Live & Published</span>
            <span className="text-base font-bold text-emerald-800 font-mono">{publishedCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Drafts / In Review</span>
            <span className="text-base font-bold text-amber-800 font-mono">{draftCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Total Readers</span>
            <span className="text-base font-bold text-blue-900 font-mono">{totalReaders}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, category, ISBN, exam..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-ink"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Pills */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-white text-brand-ink shadow-xs font-semibold"
                    : "text-gray-600 hover:text-brand-ink"
                }`}
              >
                All ({books.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PUBLISHED")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === "PUBLISHED"
                    ? "bg-white text-emerald-800 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-emerald-700"
                }`}
              >
                Published ({publishedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DRAFT")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === "DRAFT"
                    ? "bg-white text-amber-800 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-amber-700"
                }`}
              >
                Drafts ({draftCount})
              </button>
            </div>

            {/* Category Dropdown Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-ink"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Book Catalog Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="p-4">Publication</th>
                <th className="p-4">Category</th>
                <th className="p-4">Author</th>
                <th className="p-4">Price</th>
                <th className="p-4">Readers</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <p className="font-semibold text-gray-700 text-sm">No publications found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL"
                        ? "Try clearing filters to see all catalog titles."
                        : "Click 'Add New Publication' to create your first digital book."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const hasDiscount = book.salePrice != null && book.salePrice > 0 && book.salePrice < book.price;
                  return (
                    <tr key={book.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 aspect-[3/4] rounded-md shadow-xs overflow-hidden shrink-0 border border-gray-200 bg-gray-100">
                            {book.coverImage ? (
                              <Image
                                src={book.coverImage}
                                alt={book.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <BookOpen className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-brand-ink block line-clamp-1 text-xs">
                                {book.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              {book.examMetadata && (
                                <span className="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">
                                  {book.examMetadata.examAcronym}
                                </span>
                              )}
                              {book.edition && (
                                <span className="text-[10px] text-gray-400">
                                  {book.edition}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-gray-600 font-medium">
                        {book.category?.name || "Uncategorized"}
                      </td>

                      <td className="p-4 text-gray-600">{book.author?.name || "Unknown"}</td>

                      {/* Corrected Price Display */}
                      <td className="p-4">
                        {hasDiscount ? (
                          <div>
                            <span className="font-bold text-emerald-700">
                              ${book.salePrice.toFixed(2)}
                            </span>
                            <span className="text-gray-400 font-normal line-through ml-1.5">
                              ${book.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-brand-ink">
                            ${book.price.toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-brand-ink">
                          {book._count?.entitlements || 0}
                        </span>{" "}
                        <span className="text-gray-400">licensed</span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            book.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700"
                              : book.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {book.status}
                        </span>
                      </td>

                      {/* Actions: Edit Title, Sales Page, Read */}
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditClick(book)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-brand-ink hover:text-white text-gray-700 font-semibold text-[11px] transition-colors shadow-2xs"
                          title="Edit publication details, price, descriptions"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Title</span>
                        </button>

                        <Link
                          href={`/books/${book.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-brand-ink hover:bg-gray-100 transition-colors text-[11px]"
                          title="View public sales page"
                        >
                          <span>Store</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        <Link
                          href={`/reader/${book.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors font-medium text-[11px]"
                          title="Open in protected reader"
                        >
                          <span>Read</span>
                          <BookOpen className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Book Modal */}
      <CreateBookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        categories={categories}
        authors={authors}
        imprints={imprints}
      />

      {/* Edit Book Modal */}
      <EditBookModal
        isOpen={editModalOpen}
        book={editingBook}
        onClose={() => {
          setEditModalOpen(false);
          setEditingBook(null);
        }}
        categories={categories}
        authors={authors}
        imprints={imprints}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
      />
    </div>
  );
}
