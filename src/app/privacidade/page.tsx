import { AvisoRevisao, Secao } from "@/components/TextoLegal";

export const metadata = { title: "Política de Privacidade" };

export default function Privacidade() {
  return (
    <article className="space-y-5">
      <h1 className="text-2xl font-bold text-marca">Política de Privacidade</h1>
      <AvisoRevisao />
      <Secao titulo="1. Quem cuida dos seus dados">
        <p>[REVISAR COM ADVOGADO] Razão social, CNPJ e contato do encarregado de dados (DPO) do ProntoJá.</p>
      </Secao>
      <Secao titulo="2. Dados que coletamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Cadastro: nome, e-mail, foto, telefone/WhatsApp e bairro.</li>
          <li>Profissionais: descrição, especialidades, cursos/certificados e fotos de trabalhos.</li>
          <li>Pedidos: fotos, descrição, bairro, endereço, data desejada e valores negociados.</li>
          <li>Avaliações e dados técnicos de acesso (data, hora, dispositivo).</li>
        </ul>
        <p>[REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="3. Para que usamos">
        <p>Para conectar clientes e profissionais, intermediar a negociação e o pagamento, prevenir fraudes e cumprir obrigações legais. Base legal: execução de contrato e legítimo interesse (art. 7º da LGPD). [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="4. Com quem compartilhamos">
        <p>Telefone e endereço completo só são exibidos à outra parte depois do acordo pago. Fotos do pedido são vistas apenas pelo cliente e por profissionais da categoria. Usamos fornecedores de infraestrutura (Supabase, Vercel) e, futuramente, de pagamento. [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="5. Seus direitos">
        <p>Você pode pedir acesso, correção, exclusão ou portabilidade dos seus dados e revogar consentimentos, conforme o art. 18 da LGPD. [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="6. Por quanto tempo guardamos">
        <p>[REVISAR COM ADVOGADO] Prazos de retenção de dados de cadastro, pedidos e transações financeiras.</p>
      </Secao>
    </article>
  );
}
