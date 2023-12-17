import { isElementInViewport } from "./utils.js";

export default () => ({
  db: {
    children: {
      "Patente CIG": {
        icon: "scooter.png",
        children: {
          Conseguimento: {
            content:
              "<p>Per il certificato medico di idoneità psicofisica finalizzato al conseguimento della patente CIG occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti;</li><li>1 marca da bollo di € 16,00;</li><li>occhiali o lenti a contatto se necessario;</li></ul><p class='mt-3'><span class='font-bold'>Attenzione!</span> Se l'interessato è minorenne dovrà essere accompagnato da un genitore.</p>",
          },
          Rinnovo: {
            content:
              "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario;</li></ul><p>Per l'effettuazione della pratica, non è più necessiario che l'interessato acquisti la marca da bollo da € 16,00, in quanto questa è stata sostituita con un bollettino postale di pari importo. Lo studio medico ha già a disposizione i bollettini pre-pagati di € 16,00 (+ € 1,80 di tasse postali) e € 9,00 € (+ € 1,80 di tasse postali).</p><p>Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascerà all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, la patente di guida sarà recapitata per posta assicurata.</p><p class='mt-3'><span class='font-bold'>Attenzione!</span> Se l'interessato è minorenne dovrà essere accompagnato da un genitore.</p>",
          },
          "Duplicato documento": {
            content:
              "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potrà effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovrà venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una marca da bollo di € 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario;</li></ul><p class='mt-3'><span class='font-bold'>Attenzione!</span> Se l'interessato è minorenne dovrà essere accompagnato da un genitore.</p>",
          },
        },
      },
      "Patente A": {
        icon: "motorcycle.png",
        children: {
          Conseguimento: {
            content:
              "<p>Per il certificato medico di idoneità psicofisica al conseguimento della patente A occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li> certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti;</li><li>una marca da bollo di € 16,00;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          },
          Rinnovo: {
            content:
              "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario.</li></ul><p>Per l'effettuazione della pratica, non necessita più che l'interessato acquisti la marca da bollo da € 16,00, in quanto questa è stata sostituita dalla normativa con un bollettino postale di pari importo. Lo studio medico ha già a disposizione i bollettini pre-pagati di € 16,00 (+ € 1,80 di tasse postali) e € 9,00 € (+ € 1,80 di tasse postali). Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascerà all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, la patente di guida sarà recapitata per posta assicurata.</p><p>Con il solo pagamento del certificato medico (senza spese aggiuntive) la pratica per il rinnovo della patente è da considerarsi conclusa, senza che l'interessato debba recarsi presso agenzie e/o autoscuole.</p>",
          },
          duplicato: {
            content:
              "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potrà effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovrà venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una marca da bollo di € 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          },
        },
      },
      "Patente B": {
        icon: "car.png",
        children: {
          Conseguimento: {
            content:
              "<p>Per il certificato medico di idoneità psicofisica al conseguimento della patente B occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti; una marca da bollo di € 16,00;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          },
          Rinnovo: {
            content:
              "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario.</li></ul><p>Per l'effettuazione della pratica, non necessita più che l'interessato acquisti la marca da bollo da € 16,00, in quanto questa è stata sostituita dalla normativa con un bollettino postale di pari importo. Lo studio medico ha già a disposizione i bollettini pre-pagati di € 16,00 (+ € 1,80 di tasse postali) e € 9,00 € (+ € 1,80 di tasse postali). Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascerà all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, la patente di guida sarà recapitata per posta assicurata.</p><p>Con il solo pagamento del certificato medico (senza spese aggiuntive) la pratica per il rinnovo della patente è da considerarsi conclusa, senza che l'interessato debba recarsi presso agenzie e/o autoscuole.</p>",
          },
          duplicato: {
            content:
              "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potrà effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovrà venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una marca da bollo di € 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          },
        },
      },
      "Altre Patenti": {
        icon: "truck.png",
        children: {
          Conseguimento: {
            content:
              "<p>Per il certificato medico di idoneità psicofisica al conseguimento della patente di guida occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>certificato medico anamnestico rilasciato dal proprio medico di famiglia;</li><li>nr. 3 foto-tessere recenti;</li><li>una marca da bollo di € 16,00;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          },
          Rinnovo: {
            content:
              "<p>Per il rilascio del certificato medico utile al rinnovo della patente di guida, occorre che l'interessato venga a visita medica munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una foto-tessera recente;</li><li>occhiali o lenti a contatto se necessario.</li></ul><p>Per l'effettuazione della pratica, non necessita più che l'interessato acquisti la marca da bollo da € 16,00, in quanto questa è stata sostituita dalla normativa con un bollettino postale di pari importo. Lo studio medico ha già a disposizione i bollettini pre-pagati di € 16,00 (+ € 1,80 di tasse postali) e € 9,00 € (+ € 1,80 di tasse postali).</p><p>Tramite il collegamento in tempo reale con il Portale dell'Automobilista, il sanitario rilascerà subito all'interessato la ricevuta dell'avvenuto rinnovo e, dopo pochi giorni, riceverà il duplicato della patente di guida per posta assicurata.</p>",
          },
          duplicato: {
            content:
              "<p>Nel caso che l'interessato necessiti di effettuare un duplicato della propria patente di guida (o per smarrimento o per deterioramento) potrà effettuare presso il nostro studio la visita per il rilascio del certificato medico utile alla pratica. L'interessato dovrà venire munito di:</p><ul class='my-6 list-disc list-inside'><li>documento d'identità in corso di validità;</li><li>una marca da bollo di € 16.00;</li><li>nr. 3 foto-tessere recenti;</li><li>occhiali o lenti a contatto se necessario.</li></ul>",
          },
        },
      },
      "Certificato SPORT": {
        icon: "sport.png",
        content:
          "I sanitari dello Studio Medico Izzo Arduino sono autorizzati alle visite mediche e al rilascio del certificato medico per l'idoneità all'attività sportiva non agonistica.",
      },
      "Certificato ARMI": {
        icon: "gun.png",
        content:
          "I sanitari dello Studio Medico Izzo Arduino sono autorizzati al rilascio/rinnovo del Porto d'Armi, sia per uso sportivo e caccia (art. 1) che difesa personale (art. 2), e la detenzione.",
      },
      "Certificato VOLO": {
        icon: "aircraft.png",
        content:
          "<p>I sanitari dello Studio Medico Izzo Arduino sono autorizzati alle visite mediche finalizzate al rilascio dei seguenti certificati:</p><ul class='my-6 list-disc list-inside'><li>certificazioni ENAC di II Classe (pilota privato di aeromobili - PPL);</li><li>certificazioni per volo da diporto sportivo (ultraleggeri);</li><li>certificazioni per paracadutismo sportivo;</li><li>certificazioni per cabin crew o assistente di volo;</li><li>certificazioni per piloti di velivoli a pilotaggio remoto (DRONI).</li></ul>",
      },
      ALTRO: {
        content:
          "<p>I sanitari dello Studio Medico Izzo Arduino sono autorizzati alle visite mediche ed al rilascio dei seguenti certificati medici:</p><ul class='my-6 list-disc list-inside'><li>certificato medico di idoneità specifica (sana e robusta costituzione fisica) a una determinata attività lavorativa, che di solito viene richiesto all'interessato dal datore di lavoro all'atto di assunzione (Pubblica Amministrazione, Scuola, Camera Commercio, ecc.);</li><li>certificato medico attestante uno stato di buona salute (sana e robusta costituzione fisica) e un giudizio sanitario favorevole al rilascio di prestiti erogati ai dipendenti da Enti pubblici (INPDAP) o società private.</li></ul>",
      },
    }
  },
  crumbs: ["Certificati"],
  filteredDb: null,
  currentCardIndex: 0,
  get cards() {
    return this.filteredDb || this.db
  },
  selectCard(cardTitle) {
    this.crumbs.push(cardTitle);
    this.filteredDb = this.filteredDb
      ? this.filteredDb["children"][cardTitle]
      : this.db["children"][cardTitle];
    this.currentCardIndex = 0;
    this.getCardIntoView(this.$refs.refCrumbs)
  },
  selectCrumb(crumb) {
    if (crumb == this.crumbs.slice(-1)[0]) return;
    const crumbIndex = this.crumbs.findIndex((e) => e == crumb);
    const truncatedCrumbs = this.crumbs.slice(0, crumbIndex+1);
    this.filteredDb = null;
    this.crumbs = ["Certificati"]
    this.currentCardIndex = 0;
    truncatedCrumbs.slice(1).forEach((crumb) => this.selectCard(crumb));
  },
  getCardIntoView(elm) {
    if (!this.isElementInViewport(elm))
      elm.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
  },
  isElementInViewport,
});
