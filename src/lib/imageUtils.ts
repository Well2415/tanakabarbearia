/**
 * Otimiza uma imagem redimensionando-a e comprimindo-a para WebP (ou JPEG if WebP not supported).
 * @param file O arquivo de imagem original.
 * @param maxWidth Largura máxima permitida.
 * @param quality Qualidade da compressão (0.0 a 1.0).
 * @returns Uma Promise que resolve para a string base64 da imagem otimizada.
 */
export const optimizeImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calcula proporções
                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Não foi possível obter o contexto do canvas'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Tenta WebP primeiro (melhor compressão)
                let optimizedBase64 = canvas.toDataURL('image/webp', quality);

                // Fallback: Se WebP não resultou em redução ou não foi suportado, usamos JPEG
                if (optimizedBase64.startsWith('data:image/png')) {
                    optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(optimizedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// Alias for backward compatibility if needed, but we'll update the imports
export const processImage = optimizeImage;
