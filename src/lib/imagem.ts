/**
 * Comprime uma foto no próprio celular antes de enviar:
 * reduz para no máximo `maxLado` pixels e salva como JPEG.
 * Uma foto de 4 MB da câmera costuma virar ~250 KB.
 */
export async function comprimirImagem(arquivo: File, maxLado = 1600, qualidade = 0.8): Promise<Blob> {
  if (!arquivo.type.startsWith("image/")) throw new Error("ARQUIVO_NAO_E_IMAGEM");

  const imagem = await carregar(arquivo);
  const escala = Math.min(1, maxLado / Math.max(imagem.width, imagem.height));
  const largura = Math.round(imagem.width * escala);
  const altura = Math.round(imagem.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("SEM_CANVAS");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(imagem, 0, 0, largura, altura);
  if ("close" in imagem) imagem.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("FALHA_COMPRESSAO"))), "image/jpeg", qualidade),
  );
}

async function carregar(arquivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    } catch {
      /* alguns navegadores antigos não aceitam a opção: usa o método abaixo */
    }
  }
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
