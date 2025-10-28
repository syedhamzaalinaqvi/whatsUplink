
import { Header } from "@/components/layout/header";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 container">
        <div className="py-12 md:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">About WhatsUpLink</h1>
              <p className="text-lg text-muted-foreground">
                Your number one directory for discovering and sharing WhatsApp group links.
              </p>
            </div>
            <div className="space-y-6 text-lg">
              <p>
                Welcome to WhatsUpLink! Our mission is to create a comprehensive and easy-to-use directory of WhatsApp groups from around the world. Whether you're looking for a group to discuss your favorite hobbies, stay updated on news, connect with professionals in your field, or just find a fun community, we've got you covered.
              </p>
              <p>
                Our platform allows users to easily submit new group links, helping our directory grow and stay up-to-date. Each submission is reviewed to ensure quality and safety for our community. You can browse groups by category, country, or search for specific keywords to find exactly what you're looking for.
              </p>
              <p>
                We believe in the power of community and connection. WhatsUpLink was built to bridge the gap and make it easier for people to find their tribes. Thank you for being a part of our growing community!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
