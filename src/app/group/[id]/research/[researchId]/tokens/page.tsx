import TokensClient from "./TokensClient";

export default async function TokensPage({
  params,
}: {
  params: Promise<{ id: string; researchId: string }>;
}) {
  const { id, researchId } = await params;

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
        Tokens da pesquisa
      </h1>

      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        groupId: <code>{id}</code>
        <br />
        researchId: <code>{researchId}</code>
      </p>

      <TokensClient researchId={researchId} />
    </main>
  );
}
