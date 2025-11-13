import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ClienteDashboardComponent } from './cliente-dashboard/cliente-dashboard.component';
import { EquipamentosClienteComponent } from './equipamentos-cliente/equipamentos-cliente.component';
import { FormEquipamentoComponent } from './form-equipamento/form-equipamento.component';
import { ExclusionModalComponent } from './exclusion-modal/exclusion-modal.component';
import { FormSetorComponent } from './form-setor/form-setor.component';
import { SetoresClienteComponent } from './setores-cliente/setores-cliente.component';
import { PtLubrificacaoComponent } from './pt-lubrificacao/pt-lubrificacao.component';
import { FormPtLubrificacaoComponent } from './form-pt-lubrificacao/form-pt-lubrificacao.component';
import { FormOperacaoComponent } from './form-operacao/form-operacao.component';
import { FormFilterPtLubrificacaoComponent } from './form-filter-pt-lubrificacao/form-filter-pt-lubrificacao.component';
import { OperacoesComponent } from './operacoes/operacoes.component';
import { ListaAtividadesComponent } from './lista-atividades/lista-atividades.component';
import { FormEstoqueComponent } from './form-estoque/form-estoque.component';
import { ListaEstoqueComponent } from './lista-estoque/lista-estoque.component';
import { RelatoriosComponent } from './relatorios/relatorios.component';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { FormClienteComponent } from './form-cliente/form-cliente.component';
import { SelecionarEmpresaComponent } from './selecionar-empresa/selecionar-empresa.component';
import { ListaClientesComponent } from './lista-clientes/lista-clientes.component';
import { RedefinirSenhaComponent } from './redefinir-senha/redefinir-senha.component';
import { FormProdutoComponent } from './form-produto/form-produto.component';
import { EditProdutoComponent } from './edit-produto/edit-produto.component';
import { ConfirmacaoOperacaoComponent } from './confirmacao-operacao/confirmacao-operacao.component';
import { ListaUsuariosComponent } from './lista-usuarios/lista-usuarios.component';
import { FormUsuariosComponent } from './form-usuarios/form-usuarios.component';
import { FormUsuarioClienteComponent } from './form-usuario-cliente/form-usuario-cliente.component';
import { ListaUsuarioClienteComponent } from './lista-usuario-cliente/lista-usuario-cliente.component';
import { RelatosTecnicosComponent } from './relatos-tecnicos/relatos-tecnicos.component';
import { AcoesMarcosComponent } from './acoes-marcos/acoes-marcos.component';
import { ClientePreferenciasComponent } from './cliente-preferencias/cliente-preferencias.component';
import { AdminPreferenciasClientesComponent } from './admin-preferencias-clientes/admin-preferencias-clientes.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CalendarioComponent } from './calendario/calendario.component';
import { ListaProdutoComponent } from './lista-produto/lista-produto.component';

const routes: Routes = [
  { path: '', redirectTo: '/app-login', pathMatch: 'full' },
  { path: 'app-login', component: LoginComponent },
  { path: 'app-login-admin', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'app-cliente-dashboard', component: ClienteDashboardComponent },
  { path: 'app-equipamentos-cliente', component: EquipamentosClienteComponent },
  { path: 'app-form-equipamento', component: FormEquipamentoComponent },
  { path: 'app-form-equipamento/:id_eqp/:id_setor/:descricao/:tag', component: FormEquipamentoComponent },
  { path: 'app-exclusion-modal/:publicId/:controller', component: ExclusionModalComponent },
  { path: 'app-form-setor', component: FormSetorComponent },
  { path: 'app-form-setor/:setor_id/:descricao', component: FormSetorComponent },
  { path: 'app-setores-cliente', component: SetoresClienteComponent },
  { path: 'app-pt-manutencao', component: PtLubrificacaoComponent },
  { path: 'app-pt-manutencao/:id_setor/:id_eqp', component: PtLubrificacaoComponent },
  { path: 'app-form-pt-manutencao', component: FormPtLubrificacaoComponent },
  { path: 'app-form-pt-manutencao/show-breadcumb', component: FormPtLubrificacaoComponent },
  { path: 'app-form-pt-manutencao/:id_eqp', component: FormPtLubrificacaoComponent },
  { path: 'app-form-pt-manutencao/:public_id/:id_eqp/:id_prod/:tag/:descricaoComponente', component: FormPtLubrificacaoComponent },
  { path: 'app-form-operacao/:pt_public_id/:eqp_public_id', component: FormOperacaoComponent },
  { path: 'app-form-operacao/:pt_public_id/:eqp_public_id/show-breadcumb', component: FormOperacaoComponent },
  { path: 'app-form-operacao/:op_public_id', component: FormOperacaoComponent },
  { path: 'app-form-filter-pt-lubrificacao', component: FormFilterPtLubrificacaoComponent },
  { path: 'app-operacoes', component: OperacoesComponent },
  { path: 'app-lista-atividades', component: ListaAtividadesComponent },
  { path: 'app-calendario', component: CalendarioComponent },
  { path: 'app-form-estoque', component: FormEstoqueComponent },
  { path: 'app-lista-estoque', component: ListaEstoqueComponent },
  { path: 'app-lista-estoque/baixo-estoque', component: ListaEstoqueComponent },
  { path: 'baixo-estoque-consulta', redirectTo: '/app-lista-estoque/baixo-estoque', pathMatch: 'full' },
  { path: 'app-relatorios', component: RelatoriosComponent },
  { path: 'app-qr-code/:dominio/:tag/:descricao', component: QrCodeComponent },
  { path: 'recuperar-senha', component: RedefinirSenhaComponent },
  { path: 'app-confirmacao-operacao', component: ConfirmacaoOperacaoComponent },
  { path: 'app-form-usuario-cliente', component: FormUsuarioClienteComponent },
  { path: 'app-form-usuario-cliente/:usuario_id', component: FormUsuarioClienteComponent },
  { path: 'app-lista-usuarios-cliente', component: ListaUsuarioClienteComponent },
  { path: 'app-relatos-tecnicos', component: RelatosTecnicosComponent },
  { path: 'app-acoes-marcos', component: AcoesMarcosComponent },
  { path: 'app-cliente-preferencias', component: ClientePreferenciasComponent },
  // Rotas admin
  { path: 'app-admin-dashboard', component: AdminDashboardComponent },
  { path: 'admin/app-selecionar-empresa', component: SelecionarEmpresaComponent },
  { path: 'admin/app-form-cliente', component: FormClienteComponent },
  { path: 'admin/app-form-cliente/:usuario_id', component: FormClienteComponent },
  { path: 'admin/app-lista-clientes', component: ListaClientesComponent },
  { path: 'admin/app-lista-produto', component: ListaProdutoComponent },
  // { path: 'admin/app-produtos', component: FormProdutoComponent },
  { path: 'admin/app-form-produto', component: FormProdutoComponent },
  { path: 'admin/app-edit-produto/:id', component: EditProdutoComponent },
  { path: 'admin/app-lista-usuarios', component: ListaUsuariosComponent },
  { path: 'admin/app-form-usuarios', component: FormUsuariosComponent },
  { path: 'admin/app-form-usuarios/:usuario_id', component: FormUsuariosComponent },
  { path: 'admin/app-preferencias-clientes', component: AdminPreferenciasClientesComponent },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
