import React, { useRef, useState } from 'react';
import { Button } from './button';
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import { optimizeImage } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
    maxWidth?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    label = "Carregar Imagem",
    className,
    maxWidth = 800
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsOptimizing(true);
            const optimizedBase64 = await optimizeImage(file, maxWidth);
            onChange(optimizedBase64);
        } catch (error) {
            console.error('Erro ao otimizar imagem:', error);
        } finally {
            setIsOptimizing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className={cn("relative group", className)}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {value ? (
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40 group-hover:border-primary/50 transition-all duration-300 shadow-xl">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full px-4 font-bold"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isOptimizing}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Alterar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="rounded-full w-9 h-9"
                            onClick={handleRemove}
                            disabled={isOptimizing}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    {isOptimizing && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <span className="text-xs font-bold uppercase tracking-widest">Otimizando...</span>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOptimizing}
                    className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center group/btn shadow-inner"
                >
                    {isOptimizing ? (
                        <>
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">Processando...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover/btn:scale-110 transition-transform duration-300">
                                <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">{label}</span>
                            <span className="text-[10px] text-zinc-500 mt-2 font-medium">JPEG, PNG, WebP (Máx. 5MB)</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

// Internal sub-icon since I can't import Edit if not using it elsewhere
const Edit = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
    </svg>
);
