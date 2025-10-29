// ABOUTME: Privacy and legal page component displaying terms of service, privacy policy and cookies policy
// ABOUTME: Displays comprehensive legal information for Red España Creativa platform

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <article>
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">
                Aviso Legal, Política de Privacidad y Cookies
              </h1>
              <p className="text-muted-foreground">
                <strong>Última actualización:</strong>{" "}
                <time dateTime="2025-11-01">1 de noviembre de 2025</time>
              </p>
              <p className="text-muted-foreground mt-2">
                Este documento aplica a <strong>Red España Creativa</strong> (
                <a
                  href="https://elcaminocreativo.es"
                  className="text-primary hover:underline"
                >
                  elcaminocreativo.es
                </a>
                ).
              </p>
            </header>

            <nav aria-label="Índice de secciones" className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Índice</h2>
              <ul className="space-y-2 list-none pl-0">
                <li>
                  <a href="#privacidad" className="text-primary hover:underline">
                    1. Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#terminos" className="text-primary hover:underline">
                    2. Términos de Servicio
                  </a>
                </li>
                <li>
                  <a href="#cookies" className="text-primary hover:underline">
                    3. Política de Cookies
                  </a>
                </li>
              </ul>
            </nav>

            <Separator className="my-8" />

            {/* POLÍTICA DE PRIVACIDAD */}
            <section id="privacidad" className="mb-12">
              <h2 className="text-3xl font-bold text-primary mb-6">
                1. Política de Privacidad
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    1.1 Responsable del tratamiento
                  </h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong>Titular:</strong> Asoc España Creativa Innovacion
                      En Red
                    </p>
                    <p>
                      <strong>Forma jurídica:</strong> Asociación u otros tipos
                      no definidos
                    </p>
                    <p>
                      <strong>CIF/NIF:</strong> G87600359
                    </p>
                    <p>
                      <strong>Domicilio:</strong> CIFUENTES. Nº 5 28021, MADRID,
                      MADRID
                    </p>
                    <p>
                      <strong>Correo de contacto:</strong>{" "}
                      <a
                        href="mailto:privacidad@espanacreativa.com"
                        className="text-primary hover:underline"
                      >
                        privacidad@espanacreativa.com
                      </a>
                    </p>
                    <p>
                      <strong>Actividad:</strong> Red privada para emprendedores
                      que permite conectar, colaborar y compartir recursos.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    1.2 Finalidad del tratamiento
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>
                      Gestionar el registro, autenticación y acceso a la
                      plataforma.
                    </li>
                    <li>
                      Facilitar la comunicación y colaboración entre usuarios
                      autorizados.
                    </li>
                    <li>
                      Enviar notificaciones operativas o relacionadas con el
                      servicio.
                    </li>
                  </ul>
                  <p className="mt-3 text-muted-foreground">
                    No se realizarán tratamientos adicionales incompatibles con
                    estas finalidades.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    1.3 Base jurídica
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>
                      <strong>Ejecución de un contrato</strong> (art. 6.1.b RGPD)
                      para crear y mantener la cuenta.
                    </li>
                    <li>
                      <strong>Cumplimiento de obligaciones legales</strong> (art.
                      6.1.c RGPD).
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">1.4 Conservación</h3>
                  <p className="text-muted-foreground">
                    Los datos se conservarán mientras dure la relación
                    contractual y, posteriormente, durante los plazos exigidos por
                    ley o hasta que solicites su supresión.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    1.5 Comunicación y encargados
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    Podrán tratar datos proveedores que prestan servicios
                    necesarios para el funcionamiento del SaaS (alojamiento,
                    soporte técnico, correo electrónico, etc.), con los que
                    mantenemos los correspondientes <em>contratos de encargo de
                    tratamiento</em> conforme al art. 28 RGPD.
                  </p>
                  <p className="text-muted-foreground">
                    No se realizarán transferencias internacionales fuera del EEE
                    salvo que existan garantías adecuadas (por ejemplo, cláusulas
                    contractuales tipo de la Comisión Europea).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">1.6 Derechos</h3>
                  <p className="text-muted-foreground mb-3">
                    Puedes ejercer los derechos de acceso, rectificación,
                    supresión, limitación, portabilidad y oposición enviando un
                    correo a{" "}
                    <a
                      href="mailto:privacidad@espanacreativa.com"
                      className="text-primary hover:underline"
                    >
                      privacidad@espanacreativa.com
                    </a>{" "}
                    y acreditando tu identidad.
                  </p>
                  <p className="text-muted-foreground">
                    Si consideras que no se han atendido correctamente tus
                    derechos, puedes reclamar ante la{" "}
                    <a
                      href="https://www.aepd.es/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Agencia Española de Protección de Datos
                    </a>
                    .
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">1.7 Seguridad</h3>
                  <p className="text-muted-foreground">
                    Aplicamos medidas técnicas y organizativas adecuadas para
                    garantizar la confidencialidad, integridad y disponibilidad de
                    la información, incluyendo cifrado, control de accesos y
                    auditorías periódicas.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* TÉRMINOS DE SERVICIO */}
            <section id="terminos" className="mb-12">
              <h2 className="text-3xl font-bold text-primary mb-6">
                2. Términos de Servicio
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">2.1 Objeto</h3>
                  <p className="text-muted-foreground">
                    Estos Términos regulan el uso de la plataforma SaaS{" "}
                    <strong>Red España Creativa</strong>, que permite a
                    emprendedores registrados conectarse y colaborar en un entorno
                    privado moderado.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2.2 Registro y acceso
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>
                      El acceso requiere solicitud mediante el formulario
                      correspondiente.
                    </li>
                    <li>
                      El acceso efectivo requiere aprobación previa por un
                      administrador.
                    </li>
                    <li>
                      El usuario se compromete a proporcionar información veraz y
                      mantenerla actualizada.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2.3 Uso correcto del servicio
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>
                      No utilizar la plataforma para actividades ilícitas ni
                      vulnerar derechos de terceros.
                    </li>
                    <li>
                      No publicar contenidos ofensivos, ilegales o confidenciales
                      sin autorización.
                    </li>
                    <li>No intentar acceder sin permiso a sistemas o datos.</li>
                  </ul>
                  <p className="mt-3 text-muted-foreground">
                    Podremos suspender o cancelar cuentas por incumplimiento de
                    estos Términos o por motivos de seguridad.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2.4 Propiedad intelectual
                  </h3>
                  <p className="text-muted-foreground">
                    Software, diseños, marcas y contenidos son propiedad de Asoc
                    España Creativa Innovacion En Red o de sus licenciantes,
                    protegidos por la legislación de propiedad intelectual e
                    industrial.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2.5 Limitación de responsabilidad
                  </h3>
                  <p className="text-muted-foreground">
                    No seremos responsables de fallos técnicos ajenos a nuestro
                    control, de usos indebidos del servicio por parte del usuario
                    ni de contenidos publicados por terceros.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2.6 Modificaciones
                  </h3>
                  <p className="text-muted-foreground">
                    Podremos modificar estos Términos para adaptarlos a cambios
                    legales o mejoras del servicio. Las modificaciones relevantes
                    se comunicarán con antelación razonable.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2.7 Baja del servicio
                  </h3>
                  <p className="text-muted-foreground">
                    El usuario puede solicitar la baja escribiendo a{" "}
                    <a
                      href="mailto:privacidad@espanacreativa.com"
                      className="text-primary hover:underline"
                    >
                      privacidad@espanacreativa.com
                    </a>
                    . Podemos suspender o eliminar cuentas por incumplimiento o
                    inactividad prolongada.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    2.8 Legislación aplicable y jurisdicción
                  </h3>
                  <p className="text-muted-foreground">
                    Se aplica la legislación española. Para cualquier controversia,
                    las partes se someten a los Juzgados y Tribunales de{" "}
                    <strong>Madrid</strong>, salvo disposición legal imperativa en
                    contrario.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* POLÍTICA DE COOKIES */}
            <section id="cookies" className="mb-12">
              <h2 className="text-3xl font-bold text-primary mb-6">
                3. Política de Cookies
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    3.1 ¿Qué son las cookies?
                  </h3>
                  <p className="text-muted-foreground">
                    Pequeños archivos que el sitio web guarda en tu dispositivo
                    para recordar información y garantizar el correcto
                    funcionamiento del servicio.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    3.2 Cookies utilizadas (solo técnicas)
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    En <strong>Red España Creativa</strong> usamos exclusivamente{" "}
                    <strong>cookies técnicas</strong> necesarias para:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>
                      Mantener la sesión iniciada y la seguridad de la
                      autenticación.
                    </li>
                    <li>
                      Recordar preferencias básicas (como el idioma).
                    </li>
                    <li>
                      Garantizar el funcionamiento esencial de la plataforma.
                    </li>
                  </ul>
                  <p className="mt-3 text-muted-foreground">
                    Estas cookies no requieren consentimiento previo (art. 22.2
                    LSSI-CE) y no se utilizan con fines analíticos ni
                    publicitarios.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">
                    3.3 Gestión o desactivación
                  </h3>
                  <p className="text-muted-foreground">
                    Puedes configurar tu navegador para bloquear o eliminar
                    cookies. Si desactivas las cookies técnicas, algunas funciones
                    pueden no estar disponibles.
                  </p>
                </div>
              </div>
            </section>

            <footer className="mt-12 pt-8 border-t text-sm text-muted-foreground">
              <p>
                © {currentYear} Asoc España Creativa Innovacion En Red —{" "}
                <a
                  href="mailto:privacidad@espanacreativa.com"
                  className="text-primary hover:underline"
                >
                  privacidad@espanacreativa.com
                </a>
              </p>
            </footer>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
