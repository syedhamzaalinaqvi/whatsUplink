
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function ContactPage() {
  return (
    <main className="flex-1">
      <div className="container py-12 md:py-24">
        <div className="mx-auto max-w-xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Have questions or feedback about our directory of WhatsApp group links? We'd love to hear from you.
            </p>
            <p className="text-sm text-muted-foreground">
              You can also reach us directly at <a href="mailto:syedhamzaalinaqvi4@gmail.com" className="text-primary underline">syedhamzaalinaqvi4@gmail.com</a>.
            </p>
          </div>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john.doe@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message..." className="min-h-[150px]" />
            </div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </div>
      </div>
    </main>
  );
  
}
