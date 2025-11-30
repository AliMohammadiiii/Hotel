# Sample Code Implementation Guide

This document captures all patterns, components, and best practices from the Sample code for reuse in the project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Routing Patterns](#routing-patterns)
3. [Layout Components](#layout-components)
4. [Form Patterns](#form-patterns)
5. [Data Table Patterns](#data-table-patterns)
6. [API Service Patterns](#api-service-patterns)
7. [Type Definitions](#type-definitions)
8. [Utility Functions](#utility-functions)
9. [Styling Patterns](#styling-patterns)
10. [Common Hooks](#common-hooks)
11. [Component Patterns](#component-patterns)

---

## Architecture Overview

### Tech Stack
- **Framework**: React 18 + TypeScript
- **Router**: TanStack Router (file-based routing)
- **Design System**: Injast Core (`injast-core/components`, `injast-core/constants`)
- **Form Management**: react-hook-form + zod
- **Data Grid**: MUI DataGrid (`@mui/x-data-grid`)
- **Icons**: iconsax-reactjs
- **Styling**: MUI System (sx prop) + RTL support
- **State Management**: URL search params via TanStack Router

### Project Structure
```
routes/
  (auth)/
    _authLayout/
      components/
      context/
      login.tsx
    _authLayout.tsx
  (dashboard)/
    _dashboardLayout/
      components/
      [pages]/
    _dashboardLayout.tsx
  __root.tsx
  index.tsx

shared/
  components/
  constants.ts
  hooks/
  utils/

services/
  [domain]/
    [resource].ts

types/
  [domain]/
    [resource].ts

libs/
  apiRequest.ts

providers/
  index.tsx

theme/
  colors.ts
```

---

## Routing Patterns

### File-Based Routing with TanStack Router

**Route Definition Pattern:**
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { INITIAL_LIMIT } from 'src/shared/constants';

// Define search params schema
const pageSearchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(INITIAL_LIMIT),
  active_tab: z.enum(['invoice', 'withdraw', 'sod']).catch('invoice'),
});

export const Route = createFileRoute('/(dashboard)/_dashboardLayout/transactions/')({
  component: TransactionPage,
  validateSearch: (search) => pageSearchSchema.parse(search),
});

function TransactionPage() {
  const { page, limit, active_tab: activeTab } = Route.useSearch();
  // Component implementation
}
```

**Layout Route Pattern:**
```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Box, Grid } from 'injast-core/components';
import { defaultColors } from 'injast-core/constants';

export const Route = createFileRoute('/(dashboard)/_dashboardLayout')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Grid container sx={{ height: '100%' }}>
      <Grid size={2} sx={{ height: '100%' }}>
        <SideBar />
      </Grid>
      <Grid size={10}>
        <Header />
        <Box
          sx={{
            bgcolor: defaultColors.neutral[50],
            height: '100%',
            py: 4,
            px: 3,
          }}
        >
          <Outlet />
        </Box>
      </Grid>
    </Grid>
  );
}
```

**Search Params Update Utility:**
```typescript
// shared/utils/updateSearchParams.ts
import { router } from 'src/app/App';

export function updateSearchParams(
  newParams: Record<string, string | number | boolean | undefined>,
) {
  router.navigate({
    to: router.state.location.pathname,
    search: (prev) => ({
      ...prev,
      ...newParams,
    }),
  });
}
```

---

## Layout Components

### Dashboard Layout Structure

**Main Layout:**
- Sidebar: 2 columns (Grid size={2})
- Main Content: 10 columns (Grid size={10})
- Header: Fixed at top
- Content Area: Scrollable with padding

**Sidebar Component Pattern:**
```typescript
import { Link } from '@tanstack/react-router';
import { Box, Image } from 'injast-core/components';
import { defaultColors } from 'injast-core/constants';

interface MenuEntry {
  key: string;
  to: string;
  search?: Record<string, string | number>;
  title: string;
  icon: Icon;
  disabled?: boolean;
}

const menuConfig: MenuEntry[] = [
  {
    key: 'transactions',
    to: '/transactions',
    search: { page: 1, limit: INITIAL_LIMIT, active_tab: 'invoice' },
    title: 'تراکنش‌ها',
    icon: MoneyArchive,
  },
];

const SideBar = () => {
  return (
    <Box sx={{ bgcolor: '#181D26', color: 'white', height: '100%', px: 2 }}>
      <Box sx={{ py: 6 }}>
        <Image src={SideBarLogo} width="100%" height={38} objectFit="contain" />
      </Box>
      <nav>
        {menuConfig.map(({ key, to, search, title, icon: Icon, disabled }) => (
          <Link
            key={key}
            to={to}
            search={search}
            disabled={disabled}
            children={({ isActive }: { isActive: boolean }) => (
              <MenuItem
                isActive={disabled ? false : isActive}
                title={title}
                icon={Icon}
                disabled={disabled}
              />
            )}
          />
        ))}
      </nav>
    </Box>
  );
};
```

**Header Component Pattern:**
```typescript
import { Box, Grid, TextField, Typography, IconButton } from 'injast-core/components';
import { defaultColors } from 'injast-core/constants';
import { longFormatInWords } from 'injast-core/utils';

const Header = () => {
  const getToday = () => {
    const persianWeekday = new Date(Date.now()).toLocaleDateString('fa-IR', {
      weekday: 'long',
    });
    const d = longFormatInWords(Date.now(), {
      dayInWord: false,
      monthInWord: true,
      yearInWord: false,
      showTime: false,
      separator: '',
    });
    return `${persianWeekday} ${d}`;
  };

  return (
    <Grid container alignItems="center" height={82}>
      <Grid size={12} py={4.5} px={3} sx={{ backgroundColor: 'white' }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid size={4}>
            <TextField
              height={46}
              fullWidth
              startAdornment={<SearchNormal1 size={20} color={defaultColors.neutral.light} />}
              placeholder="جستجو"
            />
          </Grid>
          <Grid size={4} display="flex" alignItems="center" justifyContent="end" gap={4}>
            <Box bgcolor={defaultColors.neutral[50]} py={2.5} px={2} borderRadius={2}>
              <Typography color="neutral.main">{getToday()}</Typography>
            </Box>
            <IconButton sx={{ bgcolor: defaultColors.neutral[50], p: 2, borderRadius: 2 }}>
              <LogoutCurve size="24" color={defaultColors.neutral.main} />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
```

**PageHeader Component Pattern:**
```typescript
import { Box, Grid, Typography } from 'injast-core/components';
import { defaultColors } from 'injast-core/constants';
import { ArrowRight } from 'iconsax-reactjs';

type PageHeaderProps = {
  title: string;
  breadcrumb: string[];
  children?: ReactNode;
};

const PageHeader: FC<PageHeaderProps> = ({ title, breadcrumb, children }) => {
  return (
    <Grid container sx={{ height: 76 }}>
      <Grid
        size={12}
        sx={{
          bgcolor: defaultColors.neutral[50],
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <ArrowRight color={defaultColors.neutral.dark} size={32} />
          <Box>
            <Typography variant="display2" color="neutral.dark">
              {title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, pt: 2 }}>
              {breadcrumb.map((text, index) => {
                const isLast = index === breadcrumb.length - 1;
                return (
                  <Fragment key={index}>
                    <Typography
                      variant="body2"
                      color={isLast ? 'neutral.main' : 'neutral.light'}
                    >
                      {text}
                    </Typography>
                    {!isLast && (
                      <Typography color="neutral.light" variant="body2">
                        /
                      </Typography>
                    )}
                  </Fragment>
                );
              })}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: 3 }}>
          {children}
        </Box>
      </Grid>
    </Grid>
  );
};
```

---

## Form Patterns

### React Hook Form + Zod Validation

**Form Setup Pattern:**
```typescript
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  username: z
    .string()
    .min(1, 'نام کاربری الزامی است')
    .refine((val) => /^09\d{9}$/.test(val), {
      message: 'نام کاربری باید شماره موبایل معتبر باشد',
    }),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // Handle submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

**Controller Pattern (for custom components):**
```typescript
import { Controller } from 'react-hook-form';

<Controller
  name="username"
  control={control}
  render={({ field }) => (
    <TextField
      fullWidth
      value={field.value || ''}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={!!errors.username}
      helperText={errors.username?.message}
    />
  )}
/>
```

---

## Data Table Patterns

### MUI DataGrid with Dynamic Columns

**Table Component Pattern:**
```typescript
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getRouteApi } from '@tanstack/react-router';
import { Box } from 'injast-core/components';
import { useErrorHandler } from 'injast-core/hooks';
import { createQueryParams } from 'injast-core/utils';
import { FC, useEffect, useState } from 'react';
import ContentBox from 'src/shared/components/ContentBox';
import DataGridLoading from 'src/shared/components/DataGridLoading';
import DataGridPagination from 'src/shared/components/DataGridPagination';

const routeApi = getRouteApi('/(dashboard)/_dashboardLayout/transactions/');

const InvoiceTable: FC = () => {
  const [tableColumns, setTableColumns] = useState<GridColDef[]>([]);
  const [tableRows, setTableRows] = useState<InvoiceRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const { handleError } = useErrorHandler();
  const { page, limit } = routeApi.useSearch();

  const createTableCols = (specs: ReportColumn[]): GridColDef[] => {
    return specs.map((spec) => {
      let item: GridColDef = {
        field: spec.key,
        headerName: spec.title,
        width: 150,
      };
      
      switch (spec.key) {
        case 'paid_at':
          item.cellClassName = 'app-datagrid__cell--dir-ltr';
          break;
        case 'total_rial_amount':
          item.type = 'number';
          item.valueFormatter = (value?: string) => {
            if (value && !isNaN(+value)) {
              return addCommas(value);
            }
          };
          break;
        case 'status':
          item = {
            ...item,
            width: 250,
            renderCell: (params: GridRenderCellParams<InvoiceRow, string>) => (
              <>{getInvoiceStatusText(params.row.status)}</>
            ),
          };
          break;
      }
      return item;
    });
  };

  const getReportData = async (params: string) => {
    setTableLoading(true);
    try {
      const data = await fetchInvoiceReport(params);
      const cols = createTableCols(data.data.columns);
      data.data.rows.forEach((i, index) => {
        i.id = `row-${index}`;
      });
      if (!tableColumns.length) setTableColumns(cols);
      setTableRows(data.data.rows);
    } catch (error) {
      handleError(error);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const params = { page, limit };
    const queryParams = createQueryParams(params);
    getReportData(queryParams);
  }, [page, limit]);

  return (
    <ContentBox>
      <Box display="flex" flexDirection="column" dir="rtl" minHeight={DATAGRID_WRAPPER_MIN_HIGHT}>
        <DataGrid
          rows={tableRows}
          columns={tableColumns}
          loading={tableLoading}
          slots={{
            loadingOverlay: DataGridLoading,
            pagination: () => (
              <DataGridPagination
                count={Math.round(totalItemCount / limit)}
                page={page}
                limit={limit}
              />
            ),
          }}
        />
      </Box>
    </ContentBox>
  );
};
```

**Key Patterns:**
- Dynamic column generation from API response
- Persian number formatting with `addCommas` from `@persian-tools/persian-tools`
- LTR direction for dates/PAN numbers: `cellClassName: 'app-datagrid__cell--dir-ltr'`
- Custom status rendering with utility functions
- Loading states with custom overlay component

---

## API Service Patterns

### Service Layer Structure

**API Request Configuration:**
```typescript
// libs/apiRequest.ts
import { createApiRequest } from 'injast-core/libs';
import { config } from 'src/config';

const apiRequest = createApiRequest({
  baseURL: config.apiBaseUrl,
  withCredentials: false,
  headers: {
    Authorization: config.token,
    'Accept-Language': config.appLang,
  },
});

export { apiRequest };
```

**Service Function Pattern:**
```typescript
// services/wallet/report.ts
import { ApiResponse } from 'injast-core/types';
import { apiRequest } from 'src/libs/apiRequest';
import { FetchInvoiceReportResponse } from 'src/types/wallet/report';

export const fetchInvoiceReport = async (params: string) => {
  const endpoint = `/service/wallet/admin/invoice/report?${params}`;
  const response = await apiRequest.get<ApiResponse<FetchInvoiceReportResponse>>(endpoint);
  return response.data;
};
```

**Query Params Helper:**
```typescript
// Uses injast-core/utils
import { createQueryParams } from 'injast-core/utils';

const params = { page: 1, limit: 10 };
const queryParams = createQueryParams(params); // Returns "page=1&limit=10"
```

---

## Type Definitions

### Generic Report Response Type

```typescript
// types/reportResponse.ts
export type ReportColumn = {
  key: string;
  sortable: boolean;
  type: number;
  title: string;
};

export interface FetchReportResponse<Row> {
  columns: ReportColumn[];
  rows: Row[];
}
```

### Specific Row Types

```typescript
// types/wallet/report.ts
import { FetchReportResponse } from '../reportResponse';

export type InvoiceRow = {
  id: string; // set in client - NO server-response
  no: string;
  paid_at: string;
  total_rial_amount: string;
  status: string;
  // ... other fields
};

export type FetchInvoiceReportResponse = FetchReportResponse<InvoiceRow>;
```

### API Response Wrapper

```typescript
// Uses injast-core/types
import { ApiResponse } from 'injast-core/types';

// API responses are wrapped in ApiResponse<T>
const response = await apiRequest.get<ApiResponse<FetchInvoiceReportResponse>>(endpoint);
// response.data contains the actual data
```

---

## Utility Functions

### Status Text Mapping

```typescript
// routes/(dashboard)/_dashboardLayout/transactions/utils/getStatusText.ts
export function getInvoiceStatusText(status: string): string {
  switch (status) {
    case '1':
      return 'در انتظار پرداخت';
    case '2':
      return 'پرداخت شده';
    case '3':
      return 'منقضی شده';
    case '4':
      return 'لغو شده';
    default:
      return '';
  }
}
```

### Persian Number Formatting

```typescript
import { addCommas } from '@persian-tools/persian-tools';

// In DataGrid valueFormatter
item.valueFormatter = (value?: string) => {
  if (value && !isNaN(+value)) {
    return addCommas(value);
  }
};
```

---

## Styling Patterns

### Color Usage

**Default Colors (from injast-core):**
```typescript
import { defaultColors } from 'injast-core/constants';

// Available properties:
defaultColors.neutral[50]      // Light gray background
defaultColors.neutral[100]
defaultColors.neutral[300]     // Disabled state
defaultColors.neutral.light    // Light text
defaultColors.neutral.main     // Main text
defaultColors.neutral.dark     // Dark text
defaultColors.success.main     // Success color
defaultColors.danger.main      // Error/danger color
defaultColors.orange.main      // Warning color
```

**App Colors (custom):**
```typescript
// theme/colors.ts
export const appColors = {
  primary: {
    50: '#EDFCF6',
    100: '#D4F7E8',
    // ... shades
    500: '#1DBF98',
    main: '#1DBF98',
    light: '#D4F7E8',
    dark: '#054F5B',
    contrastText: '#fff',
  },
  secondary: {
    // ... similar structure
  },
};
```

**SX Prop Patterns:**
```typescript
<Box
  sx={{
    bgcolor: defaultColors.neutral[50],
    borderRadius: 2,
    px: 3,
    py: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  }}
>
```

### RTL Support

- All text is RTL by default
- Dates and PAN numbers use LTR: `cellClassName: 'app-datagrid__cell--dir-ltr'`
- Icons positioned with `startAdornment` (right side in RTL)

---

## Common Hooks

### Intersection Observer Hook

```typescript
// shared/hooks/useOnScreen.ts
import { useState, useEffect, RefObject } from 'react';

export default function useOnScreen(
  ref: RefObject<HTMLDivElement | null>,
): boolean {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return isIntersecting;
}
```

**Usage (in Tab component):**
```typescript
const startRef = useRef<HTMLDivElement>(null);
const endRef = useRef<HTMLDivElement>(null);
const startInView = useOnScreen(startRef);
const endInView = useOnScreen(endRef);

// Show/hide scroll arrows based on visibility
```

### Error Handler Hook

```typescript
import { useErrorHandler } from 'injast-core/hooks';

const { handleError } = useErrorHandler();

try {
  // API call
} catch (error) {
  handleError(error);
}
```

---

## Component Patterns

### Tab Component with Scroll

```typescript
// routes/(dashboard)/components/Tab.tsx
import { useSearch } from '@tanstack/react-router';
import { Box, IconButton, Typography, Divider } from 'injast-core/components';
import useOnScreen from 'src/shared/hooks/useOnScreen';

interface TabProps {
  tabs: { label: string; value: string; disable?: boolean }[];
  onChange?: (tab: string) => void;
  activeTab?: string;
  setValueInSearchParams?: boolean;
}

const Tab: FC<TabProps> = ({ tabs, onChange, activeTab, setValueInSearchParams = true }) => {
  const [tabValue, setTabValue] = useState<string>(activeTab ?? '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const startInView = useOnScreen(startRef);
  const endInView = useOnScreen(endRef);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (tabValue) {
      if (onChange) onChange(tabValue);
      if (setValueInSearchParams)
        updateSearchParams({
          active_tab: tabValue,
          page: '1',
          limit: INITIAL_LIMIT,
        });
    }
  }, [tabValue, onChange]);

  const scroll = (distance: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setCanScrollLeft(!endInView);
    setCanScrollRight(!startInView);
  }, [startInView, endInView, tabs]);

  return (
    <Box
      id={PAGE_TABS_ID}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'white',
        borderRadius: 2,
        overflow: 'hidden',
        mb: 3,
        height: 50,
      }}
    >
      {canScrollRight && (
        <IconButton onClick={() => scroll(200)} sx={{ position: 'absolute', left: 0, zIndex: 1 }}>
          <ArrowRight2 color={defaultColors.neutral.main} size={24} />
        </IconButton>
      )}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <div ref={startRef} />
        {tabs.map((tab, index) => (
          <Fragment key={index}>
            <Box sx={{ width: '200px', flexShrink: 0 }}>
              <Typography
                onClick={() => {
                  if (!tab.disable) setTabValue(tab.value);
                }}
                color={tab.value === tabValue ? 'neutral.dark' : 'neutral.light'}
                sx={{
                  p: 3.5,
                  opacity: tab.disable ? '0.2' : 1,
                  cursor: tab.disable ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                  '&::after':
                    tab.value === tabValue
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '35%',
                          right: '35%',
                          borderBottom: '2px solid currentColor',
                        }
                      : undefined,
                }}
              >
                {tab.label}
              </Typography>
            </Box>
            {index < tabs.length - 1 && <Divider orientation="vertical" flexItem sx={{ my: 3 }} />}
          </Fragment>
        ))}
        <div ref={endRef} />
      </Box>
      {canScrollLeft && (
        <IconButton onClick={() => scroll(-200)} sx={{ position: 'absolute', right: 0, zIndex: 1 }}>
          <ArrowLeft2 color={defaultColors.neutral.main} size={24} />
        </IconButton>
      )}
    </Box>
  );
};
```

### TabPanel Component

```typescript
// shared/components/TabPanel.tsx
import { useSearch } from '@tanstack/react-router';
import { FC, ReactNode } from 'react';

type TabPanelProps = {
  value: string;
  activeTab?: string;
  children: ReactNode;
};

const TabPanel: FC<TabPanelProps> = ({ value, activeTab, children }) => {
  if (!activeTab) {
    const search = useSearch({ strict: false });
    if (search?.active_tab) activeTab = search?.active_tab;
    else throw new Error('no active no render panel');
  }

  return <>{value === activeTab && <>{children}</>}</>;
};
```

### ContentBox Component

```typescript
// shared/components/ContentBox.tsx
import { Box } from 'injast-core/components';
import { FC, ReactNode, useEffect, useState } from 'react';
import { PAGE_TABS_ID } from '../constants';

type ContentBoxProps = {
  children: ReactNode;
};

const ContentBox: FC<ContentBoxProps> = ({ children }) => {
  const tabEl = document.getElementById(PAGE_TABS_ID);
  const headerHight = tabEl ? 248 : 172;
  const [remaining, setRemaining] = useState(window.innerHeight - headerHight);

  useEffect(() => {
    setRemaining(window.innerHeight - headerHight);
  }, [headerHight]);

  useEffect(() => {
    const onResize = () => {
      setRemaining(window.innerHeight - headerHight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <Box
      sx={{
        bgcolor: 'white',
        borderRadius: 2,
        height: remaining,
        overflow: 'auto',
        px: 4,
        py: 6,
      }}
    >
      {children}
    </Box>
  );
};
```

### DataGridPagination Component

```typescript
// shared/components/DataGridPagination.tsx
import { Box, MenuItem, Pagination, Select, Typography } from 'injast-core/components';
import { LIMIT } from '../constants';
import { updateSearchParams } from '../utils/updateSearchParams';

type DataGridePaginationProps = {
  count: number;
  page: number;
  limit: number;
  onPageChange?: Dispatch<SetStateAction<number>>;
  onLimitChange?: Dispatch<SetStateAction<number>>;
};

const DataGridPagination: FC<DataGridePaginationProps> = ({
  count,
  page,
  limit,
  onPageChange,
  onLimitChange,
}) => {
  return (
    <Box
      sx={{
        width: '90%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Pagination
          count={count}
          page={page}
          onChange={(_e, v) => {
            updateSearchParams({ page: v });
            if (onPageChange) onPageChange(v);
          }}
          variant="outlined"
          shape="rounded"
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end', px: 2, gap: 1 }}>
        <Typography variant="label1">تعداد در صفحه</Typography>
        <Select
          value={limit}
          size="small"
          onChange={(e) => {
            updateSearchParams({ limit: e.target.value as number });
            if (onLimitChange) onLimitChange(e.target.value as number);
          }}
        >
          {LIMIT.map((el) => (
            <MenuItem value={el}>{el}</MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
};
```

### RemoveModal Component

```typescript
// shared/components/RemoveModal.tsx
import { Box, Button, Modal, Typography } from 'injast-core/components';
import { defaultColors } from 'injast-core/constants';

type RemoveModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onRemove: () => void;
};

const RemoveModal: React.FC<RemoveModalProps> = ({
  isOpen,
  title,
  description,
  onClose,
  onRemove,
}) => {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Typography variant="h2" fontWeight={700}>
          {title}
        </Typography>
        <Typography color="neutral.light">{description}</Typography>
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              width: 130,
              color: defaultColors.neutral.main,
              borderColor: defaultColors.neutral[300],
            }}
          >
            انصراف
          </Button>
          <Button onClick={onRemove} variant="contained" color="error" sx={{ width: 130 }}>
            حذف
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
```

---

## Constants

```typescript
// shared/constants.ts
export const INITIAL_LIMIT = 10;
export const LIMIT = [10, 25, 50];
export const SIDEBAR_WIDTH_SIZE = 2;
export const DATAGRID_WRAPPER_MIN_HIGHT = 400;
export const PAGE_TABS_ID = 'page-tabs';
```

---

## Provider Setup

```typescript
// providers/index.tsx
import { ReactNode } from '@tanstack/react-router';
import { MessageProvider } from 'injast-core/context';
import { SPAThemeProvider } from 'injast-core/providers';
import { appColors } from 'src/theme/colors';
import { faIR } from '@mui/x-data-grid/locales';
import { coreFaIR } from 'injast-core/utils';

export default function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const options = {
    ...coreFaIR,
    ...faIR,
  };
  return (
    <SPAThemeProvider dir="rtl" appColors={appColors} themeOptions={options}>
      <MessageProvider
        width="350px"
        toastPosition={{ vertical: 'top', horizontal: 'center' }}
      >
        {children}
      </MessageProvider>
    </SPAThemeProvider>
  );
}
```

---

## Best Practices

1. **Always use TypeScript types** - Define types for all API responses and component props
2. **URL-driven state** - Use search params for pagination, filters, and tabs
3. **Error handling** - Use `useErrorHandler` hook from injast-core
4. **Loading states** - Always show loading indicators during API calls
5. **RTL support** - Remember to use LTR for dates, PAN numbers, and English text
6. **Persian formatting** - Use `addCommas` for number formatting
7. **Dynamic columns** - Generate DataGrid columns from API response when possible
8. **Component composition** - Break down complex pages into smaller components
9. **Constants** - Define magic numbers and strings as constants
10. **Form validation** - Always use zod schemas with react-hook-form

---

## Common Patterns Summary

### Page Structure
```
Page Component
  ├── PageHeader (title + breadcrumb + actions)
  ├── Tab (if multiple views)
  ├── TabPanel (conditional content)
  └── ContentBox
      └── DataGrid or Form
```

### Data Flow
```
URL Search Params → Route.useSearch() → API Call → State Update → UI Render
```

### Component Hierarchy
```
SPAThemeProvider
  └── MessageProvider
      └── Router
          └── Layout Route
              └── Page Route
                  └── Components
```

---

This guide should serve as a comprehensive reference for implementing features following the patterns established in the Sample code.



