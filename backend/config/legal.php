<?php

return [

    'version' => '2026-07-12.1',

    'effective_date' => '2026-07-12',

    'title' => 'Termini di utilizzo — Simulazione personale (non commerciale)',

    'summary' => 'Piattaforma privata di simulazione per cassa risparmi personale. Nessuna vendita, nessuna iscrizione pubblica, accesso solo tramite carta NFC autorizzata.',

    'sections' => [
        [
            'heading' => '1. Natura del servizio (simulazione / gioco privato)',
            'body' => 'Club CRM è uno strumento software privato, sviluppato e gestito esclusivamente dal titolare per uso personale di simulazione contabile ("cassa risparmi" virtuale). Non costituisce servizio commerciale, marketplace, e-commerce, vendita al dettaglio, distribuzione di prodotti reali, né organizzazione di vendita di alcun tipo.',
        ],
        [
            'heading' => '2. Divieto di accesso non autorizzato',
            'body' => 'L\'accesso è consentito esclusivamente tramite carta NFC fisica pre-registrata dal titolare e codice PIN associato. Qualsiasi tentativo di accesso senza autorizzazione esplicita è vietato. Non esiste registrazione pubblica, inviti aperti o onboarding autonomo: ogni profilo è creato manualmente dal titolare del sistema.',
        ],
        [
            'heading' => '3. Nessuna responsabilità su dati e contenuti',
            'body' => 'Il titolare non garantisce accuratezza, completezza o veridicità di dati, saldi, prodotti, immagini o testi presenti nella piattaforma. Contenuti testuali e visivi (inclusi logo, copertine, gallerie prodotti) possono essere generati o assistiti da intelligenza artificiale, placeholder o materiali non reali. Nulla deve essere interpretato come rappresentazione di beni, servizi o transazioni reali.',
        ],
        [
            'heading' => '4. Email esclusivamente fittizie (chiavi di gioco)',
            'body' => 'Gli indirizzi email utilizzati nel sistema sono identificativi fittizi di gioco/simulazione (es. domini .club, .game, .local). Non devono essere email reali di persone fisiche. L\'uso di provider email reali (Gmail, Outlook, iCloud, ecc.) è espressamente vietato.',
        ],
        [
            'heading' => '5. Registro accessi e attività',
            'body' => 'Ogni scansione NFC, tentativo di login, setup PIN, movimento di saldo, richiesta top-up, acquisto simulato e azione amministrativa viene registrato con data, ora (UTC), indirizzo IP, user agent e metadati tecnici a fini di audit e sicurezza del titolare.',
        ],
        [
            'heading' => '6. Nota per eventuali autorità',
            'body' => 'In caso di analisi da parte di autorità competenti: il presente sistema non gestisce pagamenti reali verso terzi, non effettua vendite, non raccoglie dati identificativi reali tramite email pubbliche, non promuove attività commerciali verso il pubblico. Si tratta di ambiente chiuso, privato, non indicizzato per acquisizione utenti, con accesso vincolato a dispositivi NFC pre-autorizzati. Documentazione tecnica e log di audit sono disponibili al titolare del deployment.',
        ],
        [
            'heading' => '7. Accettazione',
            'body' => 'Utilizzando la piattaforma, creando un club simulato o effettuando un primo accesso con carta NFC, l\'utente dichiara di aver compreso e accettato integralmente questi termini nella versione indicata, rinunciando a qualsiasi pretesa derivante da interpretazione commerciale o reale del servizio.',
        ],
    ],

    'allowed_email_tlds' => ['club', 'game', 'local', 'test', 'example', 'play', 'sim', 'demo'],

    'blocked_email_domains' => [
        'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
        'yahoo.com', 'yahoo.it', 'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com',
        'aol.com', 'gmx.com', 'libero.it', 'virgilio.it', 'tim.it', 'alice.it', 'tin.it',
    ],

];
