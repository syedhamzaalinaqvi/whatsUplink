import { getCategories, getCountries, seedInitialData } from '@/app/admin/actions';
import { SubmitGroupForm } from '@/components/groups/submit-group-form';

export default async function SubmitPage() {
  await seedInitialData();
  const [categories, countries] = await Promise.all([
    getCategories(),
    getCountries(),
  ]);

  return (
    <main className="flex-1">
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4 text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Submit a New Group Link</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Share a WhatsApp group or channel with the world. Fill out the form below to add your link to our directory.
            </p>
          </div>
          <SubmitGroupForm categories={categories} countries={countries} />
        </div>
      </div>
    </main>
  );
}
