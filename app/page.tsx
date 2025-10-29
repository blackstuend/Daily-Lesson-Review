import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { getCurrentUser } from "@/lib/supabase/server"
import { BookOpen, Calendar, CheckCircle2, Menu } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetClose, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { siteConfig } from "@/lib/site-config"

export default async function HomePage() {
  const user = await getCurrentUser()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <Link href="/">
              <span className="text-lg font-semibold">Daily Study Review</span>
            </Link>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <LogoutButton variant="ghost" />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/sign-up">Sign up</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation menu</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="border-b p-4">
                  <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                    <BookOpen className="h-5 w-5" />
                    Daily Study Review
                  </Link>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {user ? (
                    <>
                      <SheetClose asChild>
                        <Button variant="ghost" asChild className="justify-start">
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <LogoutButton variant="ghost" className="justify-start" />
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button variant="ghost" asChild className="justify-start">
                          <Link href="/auth/login">Login</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="justify-start" asChild>
                          <Link href="/auth/sign-up">Sign up</Link>
                        </Button>
                      </SheetClose>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Master Your Learning with Spaced Repetition
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Review study material at optimal intervals (0, 1, 3, 7 days) to maximize retention and never forget
            what you&apos;ve learned.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </section>

        <section className="border-t bg-muted/50 py-16 mt-auto">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Add Study Items</h3>
                <p className="text-muted-foreground">Save links, vocabulary, or notes you want to remember</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Review Daily</h3>
                <p className="text-muted-foreground">Get reminded to review at scientifically proven intervals</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Track Progress</h3>
                <p className="text-muted-foreground">Visualize your learning journey with calendar view</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
