import Hero from "../components/Hero";
import Features from "../components/Features";
import Properties from "../components/Properties";
import FAQ from "../components/FAQ";

export default function Home({ setPage, user, showToast }) {
    return (
        <>
            <Hero setPage={setPage} user={user} />
            <Features />
            <Properties setPage={setPage} user={user} showToast={showToast} />
            <FAQ />
        </>
    );
}
