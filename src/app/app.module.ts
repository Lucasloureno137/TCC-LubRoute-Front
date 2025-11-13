import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { ClienteDashboardComponent } from './cliente-dashboard/cliente-dashboard.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TabelaComponent } from './tabela/tabela.component';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { EquipamentosClienteComponent } from './equipamentos-cliente/equipamentos-cliente.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { VoltarComponent } from './voltar/voltar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { SuccessSnackbarInterceptor } from './interceptors/success-snackbar.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormEquipamentoComponent } from './form-equipamento/form-equipamento.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ExclusionModalComponent } from './exclusion-modal/exclusion-modal.component';
import { MatCardModule } from '@angular/material/card';
import { FormSetorComponent } from './form-setor/form-setor.component';
import { MatMenuModule } from '@angular/material/menu';
import { SetoresClienteComponent } from './setores-cliente/setores-cliente.component';
import { PtLubrificacaoComponent } from './pt-lubrificacao/pt-lubrificacao.component';
import { FormPtLubrificacaoComponent } from './form-pt-lubrificacao/form-pt-lubrificacao.component';
import { ConfigService } from './services/config.service';
import { NotificationService } from './services/notification.service';
import { FormOperacaoComponent } from './form-operacao/form-operacao.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { MatListModule } from '@angular/material/list';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { FormFilterPtLubrificacaoComponent } from './form-filter-pt-lubrificacao/form-filter-pt-lubrificacao.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { OperacoesComponent } from './operacoes/operacoes.component';
import { ListaAtividadesComponent } from './lista-atividades/lista-atividades.component';
import { FormEstoqueComponent } from './form-estoque/form-estoque.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import { CurrencyMaskModule } from "ng2-currency-mask";
import { ListaEstoqueComponent } from './lista-estoque/lista-estoque.component';
import { PdfGeneratorComponent } from './pdf-generator/pdf-generator.component';
import { RelatoriosComponent } from './relatorios/relatorios.component';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { QRCodeModule } from 'angularx-qrcode';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { QrCodeScannerComponent } from './qr-code-scanner/qr-code-scanner.component';
import { CustomDateAdapter, CUSTOM_DATE_FORMATS } from './shared/custom-date-format';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { FormClienteComponent } from './form-cliente/form-cliente.component';
import { SelecionarEmpresaComponent } from './selecionar-empresa/selecionar-empresa.component';
import { NotificationComponent } from './notification/notification.component';
import { NotificationDialogComponent } from './notification-dialog/notification-dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { DateRangeModalComponent } from './date-range-modal/date-range-modal.component';
import { ListaClientesComponent } from './lista-clientes/lista-clientes.component';
import { RedefinirSenhaComponent } from './redefinir-senha/redefinir-senha.component';
import { AtividadeCardComponent } from './atividade-card/atividade-card.component';
import { FormProdutoComponent } from './form-produto/form-produto.component';
import { EditProdutoComponent } from './edit-produto/edit-produto.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { ConfirmacaoOperacaoComponent } from './confirmacao-operacao/confirmacao-operacao.component';
import { ListaUsuariosComponent } from './lista-usuarios/lista-usuarios.component';
import { FormUsuariosComponent } from './form-usuarios/form-usuarios.component';
import { FormUsuarioClienteComponent } from './form-usuario-cliente/form-usuario-cliente.component';
import { ListaUsuarioClienteComponent } from './lista-usuario-cliente/lista-usuario-cliente.component';
import { RelatosTecnicosComponent } from './relatos-tecnicos/relatos-tecnicos.component';
import { AcoesMarcosComponent } from './acoes-marcos/acoes-marcos.component';
import { ConfirmacaoAlteracaoRecorrenciaComponent } from './confirmacao-alteracao-recorrencia/confirmacao-alteracao-recorrencia.component';
import { ClientePreferenciasComponent } from './cliente-preferencias/cliente-preferencias.component';
import { AdminPreferenciasClientesComponent } from './admin-preferencias-clientes/admin-preferencias-clientes.component';
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarioComponent } from './calendario/calendario.component';
import { ListaProdutoComponent } from './lista-produto/lista-produto.component';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ClienteDashboardComponent,
    HeaderComponent,
    FooterComponent,
    TabelaComponent,
    EquipamentosClienteComponent,
    VoltarComponent,
    FormEquipamentoComponent,
    ExclusionModalComponent,
    FormSetorComponent,
    SetoresClienteComponent,
    PtLubrificacaoComponent,
    FormPtLubrificacaoComponent,
    FormOperacaoComponent,
    FormFilterPtLubrificacaoComponent,
    OperacoesComponent,
    ListaAtividadesComponent,
    FormEstoqueComponent,
    ListaEstoqueComponent,
    PdfGeneratorComponent,
    RelatoriosComponent,
    QrCodeComponent,
    QrCodeScannerComponent,
    AdminDashboardComponent,
    FormClienteComponent,
    SelecionarEmpresaComponent,
    NotificationComponent,
    NotificationDialogComponent,
    DateRangeModalComponent,
    ListaClientesComponent,
    RedefinirSenhaComponent,
    AtividadeCardComponent,
    FormProdutoComponent,
    EditProdutoComponent,
    BreadcrumbComponent,
    ConfirmacaoOperacaoComponent,
    ListaUsuariosComponent,
    FormUsuariosComponent,
    FormUsuarioClienteComponent,
    ListaUsuarioClienteComponent,
    RelatosTecnicosComponent,
    AcoesMarcosComponent,
    ConfirmacaoAlteracaoRecorrenciaComponent,
    ClientePreferenciasComponent,
    AdminPreferenciasClientesComponent,
    LayoutComponent,
    SidebarComponent,
    DashboardComponent,
    CalendarioComponent,
    ListaProdutoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatMenuModule,
    MatDatepickerModule,
    NgxMatTimepickerModule,
    MatListModule,
    MatMomentDateModule,
    MatTooltipModule,
    MatRadioModule,
    MatAutocompleteModule,
    AsyncPipe,
    CurrencyMaskModule,
    QRCodeModule,
    ZXingScannerModule,
    MatDialogModule,
    BrowserAnimationsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    FullCalendarModule,
  ],
  providers: [
    provideAnimationsAsync(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: SuccessSnackbarInterceptor, multi: true },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        verticalPosition: 'bottom',
        horizontalPosition: 'center'
      }
    },
    ConfigService,
    NotificationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
