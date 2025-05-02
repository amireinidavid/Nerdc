import Hero from "@/components/home/hero";
import JournalSection from "@/components/home/journal";
import WhyChooseUs from "@/components/home/why";
import { Container } from "@/components/ui/container";

export default function Home() {
  return (
    <div>
      <Hero />
      <JournalSection />
      <WhyChooseUs />
      
      <Container className="py-16">
        {/* Content for additional sections */}
      </Container>
    </div>
  );
}
