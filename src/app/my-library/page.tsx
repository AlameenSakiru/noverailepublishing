import React from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BookOpen, Clock, Bookmark, ArrowRight, Library, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Digital Library",
  description: "Access your purchased digital books and continue reading from your personal Noveraile cloud bookshelf.",
};

export default async function MyLibraryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/my-library");
  }

  // Fetch all active entitlements for this user
  const entitlements = await prisma.entitlement.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { userId: currentUser.userId },
        { user: { email: currentUser.email } },
      ],
    },
    include: {
      book: {
        include: {
          author: true,
          category: true,
          examMetadata: true,
        },
      },
    },
    orderBy: { grantedAt: "desc" },
  });

  // Fetch reading progress for each owned book
  const progressRecords = await prisma.readingProgress.findMany({
    where: {
      OR: [
        { userId: currentUser.userId },
        { user: { email: currentUser.email } },
      ],
    },
  });

  const progressMap = new Map(progressRecords.map((p) => [p.bookId, p]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Header Strip */}
      <div className="pb-8 border-b border-brand-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest block mb-1">
            Personal Cloud Bookshelf
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-ink">
            My Digital Library
          </h1>
          <p className="text-xs sm:text-sm text-brand-slate mt-1.5">
            Welcome back, {currentUser.name}. You have {entitlements.length}{" "}
            {entitlements.length === 1 ? "publication" : "publications"} licensed in your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/books"
            className="px-4 py-2 rounded-xl bg-white border border-brand-border hover:bg-brand-50 text-xs font-semibold text-brand-ink transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Library className="w-4 h-4 text-brand-600" />
            <span>Discover More Titles</span>
          </Link>
        </div>
      </div>

      {/* Library Shelf Grid */}
      <div className="mt-10">
        {entitlements.length === 0 ? (
          <div className="bg-white rounded-3xl border border-brand-border p-12 text-center max-w-lg mx-auto shadow-xs my-12">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-brand-ink">
              Your library is waiting for its first book.
            </h3>
            <p className="text-sm text-brand-slate mt-3 leading-relaxed font-light">
              Explore our comprehensive certification manuals or contemporary literary works. When you purchase a digital book, it appears right here in your private cloud bookshelf.
            </p>
            <div className="flex justify-center gap-3 mt-8">
              <Link
                href="/exam-prep"
                className="px-6 py-3 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-sm"
              >
                Explore Exam Prep
              </Link>
              <Link
                href="/books"
                className="px-6 py-3 rounded-xl bg-brand-50 border border-brand-border text-brand-ink text-xs font-semibold hover:bg-brand-100 transition-colors"
              >
                Browse All Books
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {entitlements.map(({ book }) => {
              const progress = progressMap.get(book.id);
              const percent = progress?.progressPercent || 0;
              const hasStarted = (progress?.currentPage || 1) > 1 || percent > 0;

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-6 flex gap-5">
                    {/* Book Cover Thumbnail with spine shadow */}
                    <div className="relative w-24 sm:w-28 aspect-[3/4] rounded-md shadow-book overflow-hidden shrink-0 border border-black/10">
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/30 via-white/10 to-transparent pointer-events-none" />
                    </div>

                    {/* Book Metadata & Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                          {book.category.name}
                        </span>
                        {book.examMetadata && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                            {book.examMetadata.examAcronym}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-base sm:text-lg font-bold text-brand-ink leading-snug line-clamp-2">
                        {book.title}
                      </h3>

                      <p className="text-xs text-brand-muted mt-1 font-medium">
                        By {book.author.name}
                      </p>

                      {/* Progress Bar & Percentage */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="font-semibold text-brand-slate">
                            {hasStarted ? `${Math.round(percent)}% complete` : "Not started"}
                          </span>
                          <span className="text-brand-muted text-[10px]">
                            {progress?.currentPage || 1} of {book.pageCount} Units
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-ink rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-6 py-4 bg-brand-50/60 border-t border-brand-border flex items-center justify-between">
                    <span className="text-[11px] text-brand-muted flex items-center gap-1 font-light">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{hasStarted ? "Saved position" : "Ready to read"}</span>
                    </span>

                    <Link
                      href={`/reader/${book.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-ink hover:bg-brand-900 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-brand-300" />
                      <span>{hasStarted ? "Continue Reading" : "Start Reading"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
