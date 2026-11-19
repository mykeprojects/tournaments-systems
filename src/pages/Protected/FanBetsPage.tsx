import { useCallback, useEffect, useState } from "react";
import BetPlacementForm from "../../components/betting/BetPlacementForm";
import BetsTable from "../../components/betting/BetsTable";
import Icon from "../../components/icons/Icon";
import { readSportError } from "../../infrastructure/backend/SportHttpClient";
import { bettingService } from "../../services/bettingService";
import type {
  Bet,
  CreateBetInput,
  FanPaymentMethod,
  Match,
} from "../../models/betting";
import { EmptyNote, NoticeBanner, PageHeader, Panel, type Notice } from "../../sports/ui";

const dateTime = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "full",
  timeStyle: "short",
});

const fetchFanBetData = () =>
  Promise.allSettled([
    bettingService.listAvailableMatches(),
    bettingService.listPaymentMethods(),
    bettingService.listMyBets(),
  ]);

type FanBetDataResult = Awaited<ReturnType<typeof fetchFanBetData>>;

export default function FanBetsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<FanPaymentMethod[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingBetId, setCancellingBetId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const applyBetData = useCallback((results: FanBetDataResult) => {
    const [availableMatches, methods, myBets] = results;
    const errors: string[] = [];
    if (availableMatches.status === "fulfilled") {
      setMatches(availableMatches.value);
      setSelectedMatch((current) =>
        current ? availableMatches.value.find((match) => match.id === current.id) ?? null : null
      );
    } else {
      errors.push(readSportError(availableMatches.reason));
    }
    if (methods.status === "fulfilled") {
      setPaymentMethods(methods.value.filter((method) => method.isActive));
    } else {
      errors.push(readSportError(methods.reason));
    }
    if (myBets.status === "fulfilled") {
      setBets(myBets.value);
    } else {
      errors.push(readSportError(myBets.reason));
    }
    setLoadError(errors.length ? errors.join(" ") : null);
    setLoading(false);
  }, []);

  const loadData = useCallback(async () => {
    applyBetData(await fetchFanBetData());
  }, [applyBetData]);

  useEffect(() => {
    let active = true;
    fetchFanBetData().then((results) => {
      if (active) applyBetData(results);
    });
    return () => {
      active = false;
    };
  }, [applyBetData]);

  const placeBet = async (input: CreateBetInput) => {
    setSubmitting(true);
    setNotice(null);
    try {
      await bettingService.placeBet(input);
      setSelectedMatch(null);
      setNotice({ tone: "ok", title: "Apuesta registrada", message: "La cuota quedó fijada por el sistema al momento del registro." });
      setLoading(true);
      setLoadError(null);
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBet = async (betId: number) => {
    setCancellingBetId(betId);
    setNotice(null);
    try {
      await bettingService.cancelBet(betId);
      setNotice({ tone: "ok", message: "La apuesta fue cancelada según las reglas vigentes." });
      setBets(await bettingService.listMyBets());
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setCancellingBetId(null);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Icon name="ticket" className="h-5 w-5" />}
        title="Apuestas"
        subtitle="Consulta los partidos abiertos, registra tus selecciones y revisa su liquidación."
        actions={
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              void loadData();
            }}
            disabled={loading}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-[#3dff7a]/40 disabled:opacity-50"
          >
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        }
      />
      {loadError && (
        <NoticeBanner
          notice={{ tone: "error", message: loadError }}
          onClose={() => setLoadError(null)}
        />
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Partidos disponibles</h2>
            <p className="mt-1 text-sm text-slate-400">Solo se muestran encuentros que reciben apuestas.</p>
          </div>
        </div>
        {loading && matches.length === 0 ? (
          <Panel><EmptyNote>Cargando partidos…</EmptyNote></Panel>
        ) : matches.length === 0 ? (
          <Panel><EmptyNote>No hay partidos abiertos para apostar en este momento.</EmptyNote></Panel>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {matches.map((match) => (
              <Panel key={match.id} className="p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-base font-black text-white">
                      {match.homeTeam} <span className="text-slate-500">vs</span> {match.awayTeam}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Inicia {dateTime.format(new Date(match.startsAt))}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                    Apuestas abiertas
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Local", odd: match.homeOdd },
                    { label: "Empate", odd: match.drawOdd },
                    { label: "Visitante", odd: match.awayOdd },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2">
                      <p className="text-[11px] text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-black text-[#3dff7a]">{item.odd.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMatch((current) => current?.id === match.id ? null : match)}
                  disabled={!paymentMethods.length}
                  className="mt-4 w-full rounded-lg bg-[#3dff7a] px-4 py-2.5 text-sm font-black text-[#04210f] transition hover:bg-[#62ff96] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedMatch?.id === match.id ? "Cerrar formulario" : "Apostar en este partido"}
                </button>
                {selectedMatch?.id === match.id && paymentMethods.length > 0 && (
                  <BetPlacementForm
                    match={match}
                    paymentMethods={paymentMethods}
                    submitting={submitting}
                    onCancel={() => setSelectedMatch(null)}
                    onSubmit={(input) => void placeBet(input)}
                  />
                )}
              </Panel>
            ))}
          </div>
        )}
        {!loading && paymentMethods.length === 0 && (
          <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            No tienes métodos de pago activos. Registra o activa uno antes de realizar una apuesta.
          </p>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-white">Mis apuestas</h2>
          <p className="mt-1 text-sm text-slate-400">Estado, cuota fijada y valor liquidado por apuesta.</p>
        </div>
        {loading && bets.length === 0
          ? <Panel><EmptyNote>Cargando tus apuestas…</EmptyNote></Panel>
          : <BetsTable bets={bets} cancellingBetId={cancellingBetId} onCancel={(id) => void cancelBet(id)} />}
      </section>
    </div>
  );
}
