import { LessonRow } from "@/components/learn/hub/LessonRow";
import { groupSyllabusSections } from "@/lib/queries/learn/paths";
import { rolesFromTags } from "@/lib/learn/roles";
import type { LearnPathLesson } from "@/lib/learn/types";
import { cn } from "@/lib/utils";

/**
 * The syllabus of one JALUR (01 §3.1, 03-UI §11.1).
 *
 * **This component is the thing that replaced Course and Modul pages.** The
 * four-level `Path → Course → Module → Lesson` model was cut because at the real
 * corpus it produces 143 container pages for 100 leaf pages — more index pages
 * than content pages, every one of them a heading plus three links competing
 * with its own lessons. What readers actually gained from a module was seeing
 * *"Bagian 2 — Mengukur dan Mendiagnosis"* group four lessons in a list. That is
 * a `section_label` string on the ordered join, rendered here as a group
 * heading, with no URL, no metadata, no page and no review cycle.
 *
 * **There is no branch in this component that can render an empty or unresolved
 * slot, and there must never be one.** `v_learn_path_lessons` joins published
 * lessons to published paths, so an unwritten or unpublished lesson does not
 * arrive as a hole to fill — it is absent. No greyed row, no "segera hadir", no
 * lock icon, and no `4 / 12`: a count of things that do not exist is a promise,
 * and an unkept promise on a site positioned on competence is a liability.
 * An empty `lessons` array renders `null`, not an empty state.
 *
 * Numbering is continuous across groups, because the reader's question is
 * "where am I in this jalur", not "where am I in Bagian 2".
 *
 * Fully server-rendered, zero client state. The syllabus is high-value internal
 * linking for the topic cluster and must not depend on JavaScript.
 */

export type PathSyllabusProps = {
  /**
   * Resolved steps from `getLearnPathLessons()`, already in `sort_key` order.
   * Pass the query result unfiltered — the filtering happened in the view.
   */
  lessons: readonly LearnPathLesson[];
  /** Marks the reader's current lesson when this renders inside a lesson page. */
  currentSlug?: string | null;
  /**
   * Heading level for `section_label` groups. The page owns the single `h1` and
   * normally an `h2` above this component, so groups default to `h3`.
   */
  headingLevel?: "h2" | "h3";
  id?: string;
  className?: string;
};

export function PathSyllabus({
  lessons,
  currentSlug,
  headingLevel = "h3",
  id,
  className,
}: PathSyllabusProps) {
  if (lessons.length === 0) return null;

  const sections = groupSyllabusSections(lessons);
  const Heading = headingLevel;

  let position = 0;

  return (
    <div id={id} className={cn("space-y-10", className)}>
      {sections.map((section, sectionIndex) => {
        const start = position + 1;
        position += section.lessons.length;

        return (
          <section key={`${section.label ?? "tanpa-bagian"}-${sectionIndex}`}>
            {section.label ? (
              <Heading className="mono-label border-b border-border pb-3 text-muted-foreground">
                {section.label}
              </Heading>
            ) : null}

            <ol className={cn(section.label && "mt-1")}>
              {section.lessons.map((lesson, lessonIndex) => (
                <LessonRow
                  key={lesson.article_id}
                  href={`/learn/${lesson.slug}`}
                  title={lesson.title}
                  excerpt={lesson.excerpt}
                  index={start + lessonIndex}
                  roleIds={rolesFromTags(lesson.tags).map((role) => role.id)}
                  readingTime={lesson.reading_time}
                  reviewedAt={lesson.reviewed_at}
                  publishedAt={lesson.published_at}
                  current={currentSlug === lesson.slug}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
