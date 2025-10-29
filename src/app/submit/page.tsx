
import { getCategories, getCountries } from '@/app/admin/actions';
import { SubmitGroupPageContent } from '@/components/groups/submit-group-page-content';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function SubmitPage() {
  // Fetch categories and countries on the server
  const [categories, countries] = await Promise.all([
    getCategories(),
    getCountries(),
  ]);

  return (
    <main className="flex-1">
      <div className="container py-12 md:py-24">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Submit a New Group or Channel</CardTitle>
              <CardDescription>
                Paste a WhatsApp group or channel link to fetch its details automatically, then fill out the rest of the form.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <SubmitGroupPageContent categories={categories} countries={countries} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
