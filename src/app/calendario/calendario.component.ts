import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { ApiResponse } from '../interfaces/api-response.interface';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    extendedProps?: {
        [key: string]: string;
    };
}

@Component({
    selector: 'app-calendario',
    templateUrl: './calendario.component.html',
    styleUrls: ['./calendario.component.css']
})
export class CalendarioComponent implements OnInit {
    @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

    events: CalendarEvent[] = [];
    isLoading: boolean = false;
    currentView: string = 'dayGridMonth';
    selectedEvent: CalendarEvent | null = null;
    headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));

    breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Calendário', active: true }
    ];

    calendarOptions: CalendarOptions = {
        initialView: 'dayGridMonth',
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        locale: 'pt-br',
        firstDay: 0,
        weekends: true,
        editable: false,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: 4,
        height: 'auto',
        eventClick: this.handleEventClick.bind(this),
        select: this.handleDateSelect.bind(this),
        events: this.events,
        eventDidMount: this.handleEventRender.bind(this),
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
        },
        allDayText: 'Todo dia',
        moreLinkText: 'mais',
        noEventsText: 'Nenhum evento para mostrar',
        eventDisplay: 'block',
        views: {
            dayGridMonth: {
                eventTimeFormat(arg){
                    return '';
                },
            },
        },
        eventTimeFormat: {
            hour: 'numeric',
            minute: '2-digit',
            meridiem: false
        }
    };

    eventTypes = [
        { value: 'MANUTENCAO', label: 'Manutenção', color: '#ff6b35' },
        { value: 'LIMPEZA', label: 'Limpeza', color: '#28a745' },
        { value: 'LUBRIFICACAO', label: 'Lubrificação', color: '#007bff' },
        { value: 'outros', label: 'Outros', color: '#6c757d' }
    ];

    constructor(
        private http: HttpClient,
        private router: Router,
        private configService: ConfigService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadEvents();
    }

    loadEvents() {
        this.isLoading = true;
        const cliente_id = localStorage.getItem('cliente_id');
        if (cliente_id) {
            this.headers = this.headers.set('user-id', cliente_id);
        }

        const baseUrl = this.configService.getBaseUrl();

        const params = new HttpParams()
            .set('startDate', '2025-07-01')
            .set('endDate', '2025-11-30');
        this.http.get<ApiResponse<any>>(baseUrl + '/lubvel/operacoes/periodo-data', {
            headers: this.headers,
            params
        }).subscribe((res) => {
            if (res.success && res.data) {
                this.events = res.data.map((item: any, index: number) => {
                    const start = this.parseDate(item.dataHoraParaExecucao);
                    const end = item.operacao.qtdHoras
                        ? this.addHours(start, item.operacao.qtdHoras)
                        : start;

                    // definir cor por tipo de atividade
                    let color = '#007bff'; // default
                    switch (item.operacao.atividade) {
                        case 'MANUTENCAO':
                            color = '#ff6b35';
                            break;
                        case 'LUBRIFICACAO':
                            color = '#007bff';
                            break;
                        case 'LIMPEZA':
                            color = '#28a745';
                            break;
                    }

                    return {
                        id: item.operacao.publicId || index.toString(),
                        title: `${item.operacao.atividade} - ${item.operacao.equipamentoNome}`,
                        start,
                        end,
                        backgroundColor: color,
                        borderColor: color,
                        textColor: '#fff',
                        extendedProps: {
                            equipamento: item.equipamento.descricao,
                            setor: item.equipamento.setor,
                            atividade: item.operacao.atividade,
                            modoAplicacao: item.operacao.modoAplicacao,
                            produto: item.operacao.produto?.nome,
                            quantidade: item.operacao.quantidade,
                            unidadeMedida: item.operacao.unidadeMedida,
                            tempoParaExecutar: item.tempoParaExecutar,
                            executado: item.executado === true ? 'Sim' : 'Não',
                            tecnico: item.operacao.usuarioClienteNome,
                        },
                    };
                });

                this.calendarOptions.events = this.events;
                this.isLoading = false;
            }
        });
    }

    // helpers
    parseDate(dateStr: string): Date {
        // API vem como "06-09-2025 00:00"
        const [d, m, yAndTime] = dateStr.split('-');
        const [y, time] = yAndTime.split(' ');
        return new Date(`${y}-${m}-${d}T${time}`);
    }

    addHours(date: Date, hours: number): Date {
        const newDate = new Date(date);
        newDate.setHours(newDate.getHours() + hours);
        return newDate;
    }

    handleEventClick(arg: EventClickArg): void {
        const event = arg.event;
        this.selectedEvent = {
            id: event.id,
            title: event.title,
            start: event.startStr,
            end: event.endStr,
            backgroundColor: event.backgroundColor,
            borderColor: event.borderColor,
            textColor: event.textColor,
            extendedProps: event.extendedProps
        };
    }

    handleDateSelect(arg: DateSelectArg): void {
        // Implementar lógica para criar novo evento se necessário
        console.log('Data selecionada:', arg.startStr, 'até', arg.endStr);
    }

    handleEventRender(arg: any): void {
        arg.el.style.cursor = 'pointer';
        // Personalizar renderização do evento se necessário
    }

    onViewChange(view: string): void {
        this.currentView = view;
        if (this.calendarComponent) {
            this.calendarComponent.getApi().changeView(view);
        }
    }

    onTodayClick(): void {
        if (this.calendarComponent) {
            this.calendarComponent.getApi().today();
        }
    }

    onPrevClick(): void {
        if (this.calendarComponent) {
            this.calendarComponent.getApi().prev();
        }
    }

    onNextClick(): void {
        if (this.calendarComponent) {
            this.calendarComponent.getApi().next();
        }
    }

    onRefresh(): void {
        this.loadEvents();
    }

    closeEventDetails(): void {
        this.selectedEvent = null;
    }

    getEventTypeLabel(tipo: string): string {
        const eventType = this.eventTypes.find(t => t.value === tipo);
        return eventType ? eventType.label : tipo;
    }

    getEventColor(tipo: string): string {
        const eventType = this.eventTypes.find(t => t.value === tipo);
        return eventType ? eventType.color : '#6c757d';
    }

    getEventProperty(event: CalendarEvent | null, property: string): string {
        if (!event || !event.extendedProps) return '';
        return event.extendedProps[property] || '';
    }

    formatDateTime(dateString: string | null | undefined): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Fechar', {
            duration: 5000,
        });
    }
}
