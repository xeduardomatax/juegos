document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.nav-button');
    const contentFrame = document.getElementById('content-frame');

        buttons.forEach(button => {
                button.addEventListener('click', () => {
                        const page = button.getAttribute('data-page');

            // Define las rutas a los index.html correspondientes
            const paths = {
                'calculo': './CalculoMental/index.html',
                'encriptacion': './Encriptación/index.html',
                'blockly': './Blockly/index.html'
            };

                        if (page === 'inicio') {
                                // Mostrar una página de espera simple dentro del iframe usando srcdoc
                                contentFrame.srcdoc = `
                                        <!doctype html>
                                        <html lang="es">
                                        <head>
                                            <meta charset="utf-8">
                                            <meta name="viewport" content="width=device-width,initial-scale=1">
                                            <title>Inicio - Espera</title>
                                            <style>
                                                html,body{height:100%;margin:0;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(135deg,#f5f7fa,#e6f2ff);}
                                                .wait {height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#0c4497}
                                                .card{background:#fff;padding:28px;border-radius:12px;box-shadow:0 10px 30px rgba(12,68,151,0.08);text-align:center;max-width:560px}
                                                .title{font-size:1.6rem;margin-bottom:8px;font-weight:700}
                                                .subtitle{color:#145ea8}
                                                .dot{width:12px;height:12px;border-radius:50%;background:#4361ee;margin-top:14px;animation:blink 1s infinite}
                                                @keyframes blink{0%{opacity:1}50%{opacity:0.25}100%{opacity:1}}
                                            </style>
                                        </head>
                                        <body>
                                            <div class="wait">
                                                <div class="card">
                                                    <div class="title">Página en espera</div>
                                                    <div class="subtitle">Selecciona una opción del menú para comenzar</div>
                                                    <div class="dot" aria-hidden="true"></div>
                                                </div>
                                            </div>
                                        </body>
                                        </html>
                                `;
                                return;
                        }

                        // Cargar páginas externas en el iframe
                        contentFrame.removeAttribute('srcdoc');
                        contentFrame.src = paths[page] || '';
                });
        });

        // Cargar la página de inicio por defecto (mensaje de espera)
        contentFrame.srcdoc = `
                <!doctype html>
                <html lang="es">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width,initial-scale=1">
                    <title>Inicio - Espera</title>
                    <style>
                        html,body{height:100%;margin:0;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(135deg,#f5f7fa,#e6f2ff);}
                        .wait {height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#0c4497}
                        .card{background:#fff;padding:28px;border-radius:12px;box-shadow:0 10px 30px rgba(12,68,151,0.08);text-align:center;max-width:560px}
                        .title{font-size:1.6rem;margin-bottom:8px;font-weight:700}
                        .subtitle{color:#145ea8}
                        .dot{width:12px;height:12px;border-radius:50%;background:#4361ee;margin-top:14px;animation:blink 1s infinite}
                        @keyframes blink{0%{opacity:1}50%{opacity:0.25}100%{opacity:1}}
                    </style>
                </head>
                <body>
                    <div class="wait">
                        <div class="card">
                            <div class="title">Página en espera</div>
                            <div class="subtitle">Selecciona una opción del menú para comenzar</div>
                            <div class="dot" aria-hidden="true"></div>
                        </div>
                    </div>
                </body>
                </html>
        `;
});