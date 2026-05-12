import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="grid min-h-[70vh] place-items-center bg-cream px-4 pt-20">
      <div className="text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-5xl">Lost the trail.</h1>
        <p className="mt-3 text-ink/60">That page doesn't exist — but your next cut still can.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link to="/" className="btn-dark">Back home</Link>
          <Link to="/book" className="btn-gold">Book an appointment</Link>
        </div>
      </div>
    </section>
  );
}
