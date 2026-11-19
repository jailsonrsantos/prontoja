import { AvisoRevisao, Secao } from "@/components/TextoLegal";

export const metadata = { title: "Termos de Uso" };
import { VERSAO_TERMOS } from "@/lib/termos";

export default function Termos() {
  return (
    <article className="space-y-5">
      <h1 className="text-2xl font-bold text-marca">Termos de Uso</h1>
      <AvisoRevisao />
      <p className="text-sm text-suave">Versão {VERSAO_TERMOS}</p>
      <Secao titulo="1. O que é o ProntoJá">
        <p>O ProntoJá é uma plataforma que aproxima clientes e profissionais autônomos de serviços em Teresina-PI. O ProntoJá não presta os serviços diretamente. [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="2. Cadastro">
        <p>Para usar o app, você precisa ter 18 anos ou mais e informar dados verdadeiros. Você é responsável pela segurança da sua senha. [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="3. Pedidos, lances e acordos">
        <p>O cliente publica um pedido; profissionais da categoria enviam lances. Quando uma das partes aceita um valor, forma-se um acordo. Os contatos (telefone, WhatsApp e endereço completo) só são liberados após o pagamento do acordo. [REVISAR COM ADVOGADO]</p>
        <p>É proibido compartilhar telefone, e-mail ou outros contatos nos textos de pedidos e lances antes do acordo pago. [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="4. Valores, taxa e comissão">
        <p>O cliente paga o valor do serviço acrescido de uma taxa de serviço de R$ 4,00. O ProntoJá retém comissão de 12% sobre o valor do serviço, descontada do valor repassado ao profissional. [REVISAR COM ADVOGADO]</p>
        <p>O pagamento fica retido pela plataforma e é liberado ao profissional após a conclusão do serviço. [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="5. Avaliações">
        <p>Após o serviço, cliente e profissional podem se avaliar. Avaliações ofensivas ou falsas podem ser removidas. [REVISAR COM ADVOGADO]</p>
      </Secao>
      <Secao titulo="6. Responsabilidades e cancelamento">
        <p>[REVISAR COM ADVOGADO] Regras de cancelamento, reembolso, garantia do serviço e limites de responsabilidade da plataforma a definir.</p>
      </Secao>
      <Secao titulo="7. Contato e foro">
        <p>[REVISAR COM ADVOGADO] Canal de atendimento, CNPJ da empresa e foro da comarca de Teresina-PI.</p>
      </Secao>
    </article>
  );
}
