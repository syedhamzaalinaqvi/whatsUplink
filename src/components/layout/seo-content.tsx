
import { Separator } from "@/components/ui/separator"
import { FC } from "react";

type SeoContentProps = {
    heading: string;
    content: string;
};

export const SeoContent: FC<SeoContentProps> = ({ heading, content }) => {
  return (
    <section className="container py-12 md:py-16">
        <Separator className="mb-12" />
        <div className="mx-auto max-w-5xl space-y-8 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {heading}
            </h2>
            <div className="prose max-w-none text-muted-foreground dark:prose-invert lg:prose-lg whitespace-pre-wrap">
                <p>
                    {content}
                </p>
            </div>
        </div>
    </section>
  )
}
