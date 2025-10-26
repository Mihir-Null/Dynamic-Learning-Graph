"use client";

import { Card, CardContent, Chip, Collapse, IconButton, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState } from "react";
import { TagTreeNode } from "@/lib/types";
import { alpha, useTheme } from "@mui/material/styles";

type TagTreeCardProps = {
  tree: TagTreeNode;
};

export default function TagTreeCard({ tree }: TagTreeCardProps) {
  const [expanded, setExpanded] = useState(true);
  const theme = useTheme();
  const accents = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.success.main
  ];

  return (
    <Card
      sx={{
        backdropFilter: "blur(26px)",
        background: `linear-gradient(160deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(
          theme.palette.background.paper,
          0.66
        )} 100%)`,
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.22)}`
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Tag Hierarchy</Typography>
          <IconButton size="small" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
        <Collapse in={expanded}>
          <Stack spacing={1} mt={2}>
            {tree.children.map((child) => (
              <TagBranch key={child.id} node={child} depth={0} accents={accents} />
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}

function TagBranch({ node, depth, accents }: { node: TagTreeNode; depth: number; accents: string[] }) {
  const color = accents[depth % accents.length] ?? "#ffffff";
  return (
    <Stack spacing={1} pl={depth * 1.5}>
      <Chip
        label={node.name}
        variant="outlined"
        size="small"
        sx={{
          alignSelf: "flex-start",
          borderColor: alpha(color, 0.4),
          backgroundColor: alpha(color, 0.15),
          color,
          fontWeight: depth <= 1 ? 600 : 500
        }}
      />
      {node.children.length > 0 && (
        <Stack spacing={1} mt={0.5}>
          {node.children.map((child) => (
            <TagBranch key={child.id} node={child} depth={depth + 1} accents={accents} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
