import { Bell, HelpCircle, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
    const location = useLocation();

    // Generate breadcrumb from current path
    const getBreadcrumb = () => {
        const path = location.pathname;
        if (path === '/') return 'Minhas cotações';
        if (path === '/buscar') return 'Busca rápida de preço';
        if (path === '/relatorios') return 'Meus relatórios';
        if (path === '/inteligencia/fornecedores') return 'Análise de fornecedores';
        if (path === '/projetos/novo') return 'Nova cotação';
        if (path.startsWith('/projeto/') && path.includes('/item/') && path.endsWith('/buscar')) return 'Preços Governamentais Art 5º Inc. I';
        if (path.startsWith('/projeto/') && path.includes('/item/')) return 'Detalhamento do item';
        if (path.startsWith('/projeto/') && path.includes('/editar')) return 'Editar cotação';
        if (path.startsWith('/projeto/')) return 'Detalhes da cotação';
        if (path.startsWith('/item/') && path.endsWith('/fontes')) return 'Fontes do item';
        return 'GovPrecos';
    };

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex h-14 items-center gap-4 px-6">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="flex-1">
                    <h2 className="text-sm font-semibold text-muted-foreground">
                        GovPrecos / {getBreadcrumb()}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <HelpCircle className="h-5 w-5" />
                    </Button>

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                        U
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">Usuário Teste</p>
                                    <p className="text-xs text-muted-foreground">admin@gov.br</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>Configurações</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
