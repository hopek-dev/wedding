// "Ceremony · Reception · Evening Party" on one line. If it has to wrap, it
// breaks between events, never in the middle of a name.
export function EventNames({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name, i) => (
        <span key={name}>
          {i > 0 && " "}
          <span className="whitespace-nowrap">{i < names.length - 1 ? `${name} ·` : name}</span>
        </span>
      ))}
    </>
  );
}
