<?php

return [

    'version' => '2026-07-12.3',

    'effective_date' => '2026-07-12',

    'owner_identity_name' => 'Julian Rovera',

    'owner_email_key' => env('GHOST_OWNER_EMAIL_KEY', 'owner@velvet.club'),

    'title' => 'Termini di utilizzo — Salvadanaio personale privato di Julian Rovera',

    'disclaimer' => 'Questa piattaforma è un database chiuso ad uso esclusivo di Julian Rovera. Solo Julian Rovera può accedere: nessun familiare, amico, collaboratore, bot, intelligenza artificiale o terzo. Accedendo dichiari espressamente di essere Julian Rovera; ogni dichiarazione viene registrata con data, ora, IP e dispositivo. Non è un sistema di vendita, non gestisce denaro di terzi e i dati presenti sono fittizi o a solo scopo di test. Ogni accesso non autorizzato è vietato e tracciato.',

    'summary' => 'Database chiuso sviluppato e utilizzato esclusivamente da Julian Rovera come salvadanaio personale gamificato. Accesso riservato al solo titolare: nessun terzo, familiare o amico. Ogni dichiarazione di identità è registrata.',

    'sections' => [
        [
            'heading' => '1. Natura del servizio (simulazione / gioco privato)',
            'body' => 'Club CRM è un database chiuso sviluppato e utilizzato unicamente da Julian Rovera come salvadanaio personale gamificato per tracciare i propri risparmi. Non costituisce servizio commerciale, club pubblico, marketplace, e-commerce, vendita al dettaglio, distribuzione di prodotti reali, gestione di denaro di terzi, né organizzazione di vendita di alcun tipo.',
        ],
        [
            'heading' => '2. Accesso esclusivo del titolare',
            'body' => 'L\'accesso è consentito esclusivamente a Julian Rovera, unico titolare e operatore autorizzato del sistema. Nessun\'altra persona fisica può accedere: non familiari, non amici, non conoscenti, non collaboratori, non visitatori. Sono altrettanto vietati accessi automatizzati da bot, script, crawler o sistemi di intelligenza artificiale. L\'accesso avviene solo tramite carta NFC fisica pre-registrata dal titolare e codice PIN personale. Non esiste registrazione pubblica, inviti aperti, deleghe o onboarding autonomo per terzi. Qualsiasi tentativo di accesso da soggetti diversi da Julian Rovera è vietato, tracciato e può comportare blocco dell\'indirizzo IP.',
        ],
        [
            'heading' => '3. Dichiarazione di identità obbligatoria',
            'body' => 'In ogni primo accesso, sblocco sessione, accettazione termini o creazione di un modulo simulato, chi interagisce con la piattaforma dichiara espressamente e sotto propria responsabilità di essere Julian Rovera. Chi non è Julian Rovera non deve proseguire. Ogni dichiarazione di identità viene registrata in modo permanente con data, ora (UTC), indirizzo IP, user agent, versione dei termini accettati e contesto dell\'operazione (accesso NFC, sblocco, creazione club, ecc.) a fini di audit e sicurezza del titolare.',
        ],
        [
            'heading' => '4. Nessuna responsabilità su dati e contenuti',
            'body' => 'Il titolare non garantisce accuratezza, completezza o veridicità di dati, saldi, prodotti, immagini o testi presenti nella piattaforma. Contenuti testuali e visivi (inclusi logo, copertine, gallerie prodotti) possono essere generati o assistiti da intelligenza artificiale, placeholder o materiali non reali. Nulla deve essere interpretato come rappresentazione di beni, servizi o transazioni reali.',
        ],
        [
            'heading' => '5. Email esclusivamente fittizie (chiavi di gioco)',
            'body' => 'Gli indirizzi email utilizzati nel sistema sono identificativi fittizi di gioco/simulazione (es. domini .club, .game, .local). Non devono essere email reali di persone fisiche. L\'uso di provider email reali (Gmail, Outlook, iCloud, ecc.) è espressamente vietato.',
        ],
        [
            'heading' => '6. Registro accessi, dichiarazioni e attività',
            'body' => 'Ogni scansione NFC, tentativo di login, dichiarazione di identità, accettazione termini, setup PIN, movimento di saldo, richiesta top-up, acquisto simulato e azione amministrativa viene registrato con data, ora (UTC), indirizzo IP, user agent e metadati tecnici a fini di audit e sicurezza del titolare.',
        ],
        [
            'heading' => '7. Nota per eventuali autorità',
            'body' => 'In caso di analisi da parte di autorità competenti: il presente sistema non gestisce pagamenti reali verso terzi, non effettua vendite, non raccoglie dati identificativi reali tramite email pubbliche, non promuove attività commerciali verso il pubblico. Si tratta di ambiente chiuso, privato, non indicizzato per acquisizione utenti, con accesso vincolato al solo titolare Julian Rovera tramite dispositivi NFC pre-autorizzati. Documentazione tecnica e log di audit sono disponibili al titolare del deployment.',
        ],
        [
            'heading' => '8. Accettazione e rinuncia',
            'body' => 'Utilizzando la piattaforma, creando un club simulato o effettuando un primo accesso con carta NFC, l\'utente dichiara di essere Julian Rovera, unico titolare autorizzato, di aver compreso e accettato integralmente questi termini nella versione indicata, e rinuncia a qualsiasi pretesa derivante da interpretazione commerciale o reale del servizio. Dichiara inoltre di essere consapevole che ogni affermazione di identità e ogni accettazione vengono registrate in modo permanente. Chi accede senza essere Julian Rovera viola espressamente questi termini.',
        ],
    ],

    'allowed_email_tlds' => ['club', 'game', 'local', 'test', 'example', 'play', 'sim', 'demo'],

    'blocked_email_domains' => [
        'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
        'yahoo.com', 'yahoo.it', 'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com',
        'aol.com', 'gmx.com', 'libero.it', 'virgilio.it', 'tim.it', 'alice.it', 'tin.it',
    ],

];
