import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { BookOpen, GraduationCap, Compass, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

export const revalidate = 60;

export const metadata = {
  title: "Publishing Categories & Collections",
  description: "Browse Noveraile Publishing books across all professional and literary categories.",
};

const iconMap: Record<string, any> = {
  GraduationCap,
  BookOpen,
  Compass,
  TrendingUp,
  Sparkles,
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    include: {
      children: {
        include: {
          _count: { select: { books: true } },
        },
      },
      _count: { select: { books: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
          Catalog Architecture
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-ink">
          Publishing Categories
        </h1>
        <p className="text-sm text-brand-slate mt-3 leading-relaxed">
          Noveraile maintains distinct editorial lines spanning rigorous certification review to contemporary literature.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat) => {
          const IconComponent = (cat.icon && iconMap[cat.icon]) || BookOpen;
          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6" />
                </div>

                <Link href={`/categories/${cat.slug}`} className="hover:text-brand-600 transition-colors">
                  <h2 className="font-serif text-xl font-bold text-brand-ink">
                    {cat.name}
                  </h2>
                </Link>

                <p className="text-xs text-brand-slate mt-2 leading-relaxed font-light">
                  {cat.description}
                </p>

                {cat.children && cat.children.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block mb-2">
                      Subcategories
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/categories/${sub.slug}`}
                          className="px-2.5 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-slate text-xs font-medium transition-colors"
                        >
                          {sub.name} ({sub._count.books})
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-brand-muted">
                  {cat._count.books} Published Titles
                </span>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:text-brand-600"
                >
                  <span>Explore Niche</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
