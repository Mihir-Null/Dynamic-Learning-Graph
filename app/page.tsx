"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Container, Grid, Paper, Stack, Typography, Snackbar } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { GraphResponse, GraphStrategy, Module, Resource } from "@/lib/types";
import { toViewModel } from "@/lib/utils/graph";
import GraphScene from "@/components/GraphScene";
import StrategyToggle from "@/components/ui/StrategyToggle";
import ModuleResourcesPanel from "@/components/ModuleResourcesPanel";
import TagTreeCard from "@/components/TagTreeCard";

export default function Page() {
  const theme = useTheme();
  const [strategy, setStrategy] = useState<GraphStrategy>("representative");
  const [data, setData] = useState<ReturnType<typeof toViewModel>>();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/graph?strategy=${strategy}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load graph (${res.status})`);
        return res.json() as Promise<GraphResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(toViewModel(payload, payload.strategy));
        setSelectedModuleId((current) => {
          if (current && payload.modules.some((module) => module.id === current)) {
            return current;
          }
          if (payload.moduleOrder.length) {
            return payload.moduleOrder[0];
          }
          return payload.modules[0]?.id ?? null;
        });
      })
      .catch((err: Error) => {
        console.error(err);
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [strategy]);

  const selectedModule: Module | null = useMemo(() => {
    if (!data || !selectedModuleId) return null;
    return data.modules[selectedModuleId] ?? null;
  }, [data, selectedModuleId]);

  const resourceRecord = useMemo<Record<string, Resource>>(
    () => data?.resources ?? ({} as Record<string, Resource>),
    [data]
  );

  const title = strategy === "representative" ? "Higher-Order Representative View" : "Reachability Closure View";
  const subtitle =
    strategy === "representative"
      ? "Representative resources chosen via higher-order minPrereqs selector."
      : "Modules ordered by prerequisite closures with aggregated profiles.";

  const pageBackdrop = useMemo(
    () =>
      `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.primary.main, 0.28)} 0%, transparent 48%), radial-gradient(circle at 85% 0%, ${alpha(
        theme.palette.secondary.main,
        0.32
      )} 0%, transparent 42%), radial-gradient(circle at 50% 100%, ${alpha(theme.palette.info.main, 0.28)} 0%, transparent 50%), ${theme.palette.background.default}`,
    [theme.palette.background.default, theme.palette.info.main, theme.palette.primary.main, theme.palette.secondary.main]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: pageBackdrop,
        py: { xs: 4, md: 6 }
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between">
              <Stack spacing={1}>
                <Typography variant="h3" fontWeight={700}>
                  Dynamic Learning Graph Prototype
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Explore hierarchical learning paths with Material-inspired graph navigation.
                </Typography>
              </Stack>
              <StrategyToggle value={strategy} onChange={setStrategy} />
            </Stack>
            <Typography variant="subtitle1" color="secondary">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          <Grid container spacing={3} sx={{ minHeight: "70vh" }}>
            <Grid item xs={12} md={8} lg={8}>
              <Paper
                elevation={0}
                sx={{
                  position: "relative",
                  height: { xs: 400, md: "70vh" },
                  borderRadius: 4,
                  overflow: "hidden",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                  background: `linear-gradient(160deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(
                    theme.palette.background.paper,
                    0.72
                  )} 100%)`,
                  backdropFilter: "blur(28px)"
                }}
              >
                {loading && (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{ position: "absolute", inset: 0, zIndex: 2, backgroundColor: "rgba(0,0,0,0.35)" }}
                  >
                    <CircularProgress color="inherit" />
                  </Stack>
                )}
                {data && (
                  <GraphScene
                    nodes={data.nodes}
                    links={data.links}
                    strategy={data.strategy}
                    selectedId={selectedModuleId}
                    onNodeSelect={(nodeId) => setSelectedModuleId(nodeId)}
                  />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4} lg={4} sx={{ display: "flex" }}>
              <ModuleResourcesPanel
                module={selectedModule}
                resources={resourceRecord}
                strategy={data?.strategy ?? strategy}
              />
            </Grid>
            <Grid item xs={12}>
              {data && <TagTreeCard tree={data.tagTree} />}
            </Grid>
          </Grid>
        </Stack>
      </Container>
      <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
