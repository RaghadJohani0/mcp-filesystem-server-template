# MCP Filesystem Server Template

Basic Model Context Protocol (MCP) filesystem server demonstrating:

- Tool definitions
- Filesystem permissions
- Read / Write / Search operations

## Tools

- read_file
- write_file
- search_files

## Security

All filesystem access is sandboxed to `/data`.

## Run

```bash
npm install
npm run dev
