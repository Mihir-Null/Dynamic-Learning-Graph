"use client";

import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import HubIcon from "@mui/icons-material/Hub";
import MergeIcon from "@mui/icons-material/Merge";
import { alpha, useTheme } from "@mui/material/styles";
import { GraphStrategy } from "@/lib/types";

type StrategyToggleProps = {
  value: GraphStrategy;
  onChange: (strategy: GraphStrategy) => void;
};

export default function StrategyToggle({ value, onChange }: StrategyToggleProps) {
  const theme = useTheme();

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, next) => {
        if (next) onChange(next);
      }}
      size="small"
      color="secondary"
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.55),
        borderRadius: 99,
        boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.18)}`
      }}
    >
      <ToggleButton value="representative">
        <Tooltip title="Pick representatives via higher-order selector (min prerequisites)">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TuneIcon fontSize="small" /> Representative
          </span>
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="closure">
        <Tooltip title="Order modules via reachability closure and aggregate profiles">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MergeIcon fontSize="small" /> Closure
          </span>
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="physics" disabled>
        <Tooltip title="Coming soon: hybrid physics layout variations">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <HubIcon fontSize="small" /> Physics
          </span>
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
