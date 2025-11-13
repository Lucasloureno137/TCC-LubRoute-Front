import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-atividade-card',
  templateUrl: './atividade-card.component.html',
  styleUrls: ['./atividade-card.component.css']
})
export class AtividadeCardComponent {
  @Input() dadosAtividade: any;
  @Input() selecionado: boolean = false; // Novo input para seleção controlada pelo pai
  @Output() selecionarAtividade = new EventEmitter<any>();
  @Output() executarAtividade = new EventEmitter<any>();

  formatarParaData(dataString: string): string {
    // Espera que a data esteja no formato "DD-MM-YYYY HH:mm"
    const [dataPart, horaPart] = dataString.split(' ');
    const [dia, mes, ano] = dataPart.split('-');

    // Retorna no formato "YYYY-MM-DDTHH:mm"
    return `${ano}-${mes}-${dia}T${horaPart}`;
  }

  emitExecutar() {
    this.executarAtividade.emit(this.dadosAtividade);
  }

  // Função chamada ao clicar no checkbox
  toggleSelecionado() {
    // Emite o evento com o valor atualizado
    this.selecionarAtividade.emit({ atividade: this.dadosAtividade, selecionado: !this.selecionado });
  }

  // Verifica se o tempo de execução está atrasado
  isAtrasado(tempoParaExecutar: string): boolean {
    return tempoParaExecutar?.includes('Atrasado');
  }

  // Verifica se a atividade foi executada
  isExecutada(): boolean {
    return this.dadosAtividade?.executado;
  }

  // Verifica se a atividade é única (não recorrente)
  isUnica(): boolean {
    return this.dadosAtividade?.frequencia === 'UNICA';
  }

  isMaquinaDesligada(): boolean {
    return this.dadosAtividade?.atividadeRequerMaquinaDesligada === true;
  }
}
