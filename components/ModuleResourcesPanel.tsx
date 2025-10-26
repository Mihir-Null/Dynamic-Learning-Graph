"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { alpha, useTheme } from "@mui/material/styles";
import { GraphStrategy, Module, Resource } from "@/lib/types";
import { scoredResourcesForModule } from "@/lib/utils/graph";
import { useMemo, useState } from "react";

const difficultyColor: Record<Resource["difficulty"], "primary" | "secondary" | "default"> = {
  Beginner: "secondary",
  Intermediate: "primary",
  Advanced: "default"
};

type ModuleResourcesPanelProps = {
  module: Module | null;
  resources: Record<string, Resource>;
  strategy: GraphStrategy;
};

type ResourceScore = ReturnType<typeof scoredResourcesForModule>[number];

export default function ModuleResourcesPanel({ module, resources, strategy }: ModuleResourcesPanelProps) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const theme = useTheme();

  const scored = useMemo<ResourceScore[]>(() => {
    if (!module) return [];
    return scoredResourcesForModule(module, resources, strategy);
  }, [module, resources, strategy]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return scored;
    return scored.filter(({ resource }) => {
      const tags = resource.flatTags ?? [];
      return (
        resource.name.toLowerCase().includes(term) ||
        tags.some((tag) => tag.toLowerCase().includes(term)) ||
        resource.type.toLowerCase().includes(term)
      );
    });
  }, [scored, search]);

  if (!module) {
    return (
      <Card
        sx={{
          height: "100%",
          backdropFilter: "blur(26px)",
          background: `linear-gradient(150deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(
            theme.palette.background.paper,
            0.68
          )} 100%)`,
          border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`
        }}
      >
        <CardContent sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h6" color="text.secondary">
              Select a module to inspect resources
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the graph to explore prerequisite relationships.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(30px)",
        background: `linear-gradient(160deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
          theme.palette.background.paper,
          0.7
        )} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
        boxShadow: `0 24px 48px ${alpha("#000", 0.6)}`
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack>
            <Typography variant="h5">{module.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {module.area} • {(module.flatTags ?? []).length} tag{(module.flatTags ?? []).length === 1 ? "" : "s"} •{" "}
              {module.resourceIds.length} resource{module.resourceIds.length === 1 ? "" : "s"}
            </Typography>
          </Stack>
          <Tooltip title="Copy module anchor">
            <Chip
              component="a"
              href={`#module-${module.id}`}
              clickable
              icon={<LaunchIcon fontSize="small" />}
              label="Direct link"
              variant="outlined"
              color="secondary"
              sx={{ fontWeight: 600 }}
            />
          </Tooltip>
        </Stack>
        <Box mt={2}>
          <TextField
            fullWidth
            size="small"
            label="Filter resources"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                backdropFilter: "blur(8px)"
              }
            }}
          />
        </Box>
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
          {module.closurePrerequisites.map((pre) => (
            <Chip
              key={pre}
              label={`Prereq: ${pre}`}
              variant="filled"
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.25)}, ${alpha(
                  theme.palette.secondary.main,
                  0.25
                )})`,
                color: theme.palette.primary.contrastText ?? "#fff"
              }}
            />
          ))}
        </Stack>
      </CardContent>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List dense disablePadding>
          {filtered.map(({ resource, similarity }) => {
            const expanded = expandedId === resource.id;
            return (
              <ListItem
                key={resource.id}
                alignItems="flex-start"
                disableGutters
                sx={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  px: 2
                }}
              >
                <ListItemButton
                  onClick={() => setExpandedId(expanded ? null : resource.id)}
                  sx={{
                    borderRadius: 2,
                    alignItems: "flex-start",
                    flexDirection: "column",
                    gap: 1,
                    border: `1px solid ${alpha(theme.palette.info.main, expanded ? 0.4 : 0.08)}`,
                    background: expanded
                      ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.18)}, ${alpha(
                          theme.palette.secondary.main,
                          0.18
                        )})`
                      : alpha(theme.palette.background.paper, 0.25),
                    transition: "background 200ms ease, border-color 200ms ease",
                    "&:hover": {
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
                        theme.palette.secondary.main,
                        0.16
                      )})`,
                      borderColor: alpha(theme.palette.primary.main, 0.35)
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={600}>
                          {resource.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {resource.type} • {resource.difficulty}
                        </Typography>
                      }
                    />
                    <Chip
                      label={`Sim ${similarity.toFixed(1)}`}
                      size="small"
                      color={similarity > 0 ? "secondary" : "default"}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {(resource.flatTags ?? []).slice(0, 4).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.secondary.main, 0.18),
                          color: theme.palette.secondary.light,
                          borderColor: alpha(theme.palette.secondary.main, 0.4)
                        }}
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </ListItemButton>
                {expanded && (
                  <Box
                    sx={{
                      width: "100%",
                      mt: 1,
                      px: 2,
                      pb: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1
                    }}
                  >
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={resource.difficulty}
                        color={difficultyColor[resource.difficulty]}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={resource.type}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: alpha(theme.palette.success.main, 0.45),
                          color: theme.palette.success.light
                        }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {resource.prerequisiteModuleIds.map((pre) => (
                        <Chip
                          key={pre}
                          label={`Requires: ${pre}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: alpha(theme.palette.warning.main, 0.5),
                            color: theme.palette.warning.main
                          }}
                        />
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`Module: ${resource.moduleName}`}
                        size="small"
                        sx={{
                          backgroundColor: alpha(theme.palette.primary.main, 0.15)
                        }}
                      />
                      <Chip
                        label={resource.area}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: alpha(theme.palette.info.main, 0.45),
                          color: theme.palette.info.light
                        }}
                      />
                    </Stack>
                    <Box>
                      <Chip
                        component="a"
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        label="Open resource"
                        icon={<LaunchIcon fontSize="small" />}
                        clickable
                        color="secondary"
                      />
                    </Box>
                  </Box>
                )}
              </ListItem>
            );
          })}
          {!filtered.length && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary">
                    No resources match “{search}”.
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Card>
  );
}
