# All Input Creation Patterns with Injast Core

This document lists all input component creation patterns found in the Sample Code using Injast Core components.

## Table of Contents

1. [TextField](#textfield)
2. [OtpInput](#otpinput)
3. [Radio & RadioGroup](#radio--radiogroup)
4. [Select & MenuItem](#select--menuitem)
5. [Form Integration Patterns](#form-integration-patterns)

---

## TextField

### Basic TextField with react-hook-form

**Location:** `Sample code/routes/(auth)/_authLayout/components/InputNumber.tsx`

```82:100:Sample code/routes/(auth)/_authLayout/components/InputNumber.tsx
          <TextField
            label="شماره موبایل"
            disabled={loading}
            startAdornment={
              <Call size="20" color={defaultColors.neutral.light} />
            }
            {...register('mobile')}
            error={!!errors.mobile}
            helperText={errors.mobile?.message}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              onKeyPress: (e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              },
            }}
          />
```

**Key Features:**
- Uses `{...register('mobile')}` from react-hook-form
- Error handling with `error` and `helperText` props
- `startAdornment` for icon (RTL support - icon appears on right)
- Custom `inputProps` for numeric input validation
- `disabled` state support

### TextField with Search Icon

**Location:** `Sample code/routes/(dashboard)/components/Header.tsx`

```46:56:Sample code/routes/(dashboard)/components/Header.tsx
              <TextField
                height={46}
                fullWidth
                startAdornment={
                  <SearchNormal1
                    size={20}
                    color={defaultColors.neutral.light}
                  />
                }
                placeholder="جستجو"
              />
```

**Key Features:**
- `fullWidth` prop for responsive width
- Custom `height` prop
- `startAdornment` with icon
- `placeholder` text

### TextField in Search Bar

**Location:** `Sample code/routes/(dashboard)/_dashboardLayout/customers/index.tsx`

```206:214:Sample code/routes/(dashboard)/_dashboardLayout/customers/index.tsx
            <TextField
              fullWidth
              height={40}
              size="small"
              startAdornment={
                <SearchNormal1 size={20} color={defaultColors.neutral.light} />
              }
              placeholder="جستجوی مشتری"
            />
```

**Key Features:**
- `size="small"` for compact design
- `height={40}` for specific sizing
- `fullWidth` for responsive layout

### TextField in Form with RadioGroup

**Location:** `Sample code/routes/(dashboard)/_dashboardLayout/customers/$customerId.tsx`

```186:194:Sample code/routes/(dashboard)/_dashboardLayout/customers/$customerId.tsx
            <TextField
              fullWidth
              height={40}
              size="small"
              startAdornment={
                <SearchNormal1 size={20} color={defaultColors.neutral.light} />
              }
              placeholder="جستجوی مشتری"
            />
```

**Key Features:**
- Used alongside other form controls
- Consistent sizing with `height={40}` and `size="small"`

---

## OtpInput

### OTP Input Component

**Location:** `Sample code/routes/(auth)/_authLayout/components/InputOtp.tsx`

```125:137:Sample code/routes/(auth)/_authLayout/components/InputOtp.tsx
            <OtpInput
              value={otp}
              onChange={setOtp}
              length={5}
              separator={<span style={{ paddingLeft: '4px' }}></span>}
              inputProps={{
                width: '46px',
                height: '48px',
                backgroundColor: defaultColors.neutral[100],
                focusedBorderColor: appColors.primary.main,
                error: !!errors.otp,
              }}
            />
```

**Key Features:**
- Controlled component with `value` and `onChange`
- `length={5}` for 5-digit OTP
- Custom `separator` between input boxes
- `inputProps` for styling individual input boxes:
  - `width` and `height` for sizing
  - `backgroundColor` for background color
  - `focusedBorderColor` for focus state
  - `error` for error state
- Used with hidden input for form integration: `<input type="hidden" {...register('otp')} />`

**Complete Integration Pattern:**

```34:45:Sample code/routes/(auth)/_authLayout/components/InputOtp.tsx
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    setValue('otp', otp);
  }, [otp, setValue]);
```

---

## Radio & RadioGroup

### RadioGroup with FormControl

**Location:** `Sample code/routes/(dashboard)/_dashboardLayout/customers/$customerId.tsx`

```165:185:Sample code/routes/(dashboard)/_dashboardLayout/customers/$customerId.tsx
            <FormControl>
              <RadioGroup
                row
                value={value}
                onChange={handleChange}
                sx={{ ml: 3 }}
              >
                <FormControlLabel
                  sx={{
                    border: 1,
                    borderRadius: 2,
                    pr: 3,
                    borderColor: defaultColors.neutral[300],
                    color: defaultColors.neutral.main,
                  }}
                  value="customer"
                  control={<Radio size="small" />}
                  label="مشتری"
                />
              </RadioGroup>
            </FormControl>
```

**Key Features:**
- Wrapped in `FormControl` component
- `RadioGroup` with `row` prop for horizontal layout
- Controlled with `value` and `onChange`
- `FormControlLabel` with custom styling:
  - Border and border radius
  - Custom padding (`pr: 3` for RTL)
  - Border color from `defaultColors`
- `Radio` with `size="small"` prop

**State Management:**

```148:152:Sample code/routes/(dashboard)/_dashboardLayout/customers/$customerId.tsx
  const [value, setValue] = useState('female');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };
```

---

## Select & MenuItem

### Select Dropdown in Pagination

**Location:** `Sample code/shared/components/DataGridPagination.tsx`

```67:78:Sample code/shared/components/DataGridPagination.tsx
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
```

**Key Features:**
- Controlled component with `value` prop
- `size="small"` for compact design
- `onChange` handler that:
  - Updates URL search params
  - Calls optional callback `onLimitChange`
- `MenuItem` children mapped from array
- Type casting: `e.target.value as number`

**Complete Context:**

```56:79:Sample code/shared/components/DataGridPagination.tsx
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'end',
          px: 2,
          gap: 1,
        }}
      >
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
```

---

## Form Integration Patterns

### React Hook Form + Zod Validation

**Complete Form Setup Pattern:**

```11:31:Sample code/routes/(auth)/_authLayout/components/InputNumber.tsx
const schema = z.object({
  mobile: z
    .string()
    .length(11, 'شماره موبایل اشتباهه.')
    .refine((val) => val.startsWith('09'), {
      message: 'شماره موبایل اشتباهه.',
    }),
});

type FormData = z.infer<typeof schema>;

const InputNumber = () => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit: handleClientSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });
```

**Key Features:**
- Zod schema for validation
- `zodResolver` for react-hook-form integration
- `mode: 'onChange'` for real-time validation
- Type inference with `z.infer<typeof schema>`
- Access to `errors` and `isValid` from `formState`

### Form Submission Pattern

```41:61:Sample code/routes/(auth)/_authLayout/components/InputNumber.tsx
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    const mobileWithoutZero = data.mobile.slice(1);

    if (
      phoneNumber === mobileWithoutZero &&
      otpExpireTime &&
      Number(otpExpireTime) > Date.now()
    ) {
      setLoginStep('otp');
      setLoading(false);
      return;
    }

    setPhoneNumber(mobileWithoutZero);
    const now = new Date();

    const otpExpireAt = now.getTime() + 2 * 60 * 1000;
    setOtpExpireTime(otpExpireAt.toString());
    setLoginStep('otp');
  };
```

### Form JSX Structure

```63:124:Sample code/routes/(auth)/_authLayout/components/InputNumber.tsx
  return (
    <Box width="100%" height="100%" alignItems="center" mt={6}>
      <Box
        component="form"
        onSubmit={handleClientSubmit(onSubmit)}
        width="100%"
        height="100%"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 10 }}>
          <Typography variant="h2" fontWeight={700} mb={4}>
            ورود به برنامه{' '}
          </Typography>
          <Typography mb={6} color="neutral.light">
            شماره موبایلت رو وارد کن
          </Typography>
          <TextField
            label="شماره موبایل"
            disabled={loading}
            startAdornment={
              <Call size="20" color={defaultColors.neutral.light} />
            }
            {...register('mobile')}
            error={!!errors.mobile}
            helperText={errors.mobile?.message}
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              onKeyPress: (e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              },
            }}
          />

          <Box display="flex" gap={1} mt={4}>
            <Typography variant="body2" color="neutral.light">
              با ورود یعنی
            </Typography>
            <Typography variant="body2" color="primary">
              قوانین و مقررات
            </Typography>
            <Typography variant="body2" color="neutral.light">
              رو قبول می‌کنی.
            </Typography>
          </Box>
        </Box>

        <Button
          type="submit"
          variant="contained"
          loading={loading}
          disabled={!isValid}
        >
          ادامه
        </Button>
      </Box>
    </Box>
  );
```

**Key Features:**
- `Box` component as form wrapper with `component="form"`
- `onSubmit={handleClientSubmit(onSubmit)}` for form submission
- Button with `disabled={!isValid}` for form validation
- `loading` state on button

---

## Common Patterns Summary

### Import Statement Pattern

All Injast Core components are imported from `'injast-core/components'`:

```typescript
import { 
  Box, 
  Button, 
  TextField, 
  Typography,
  OtpInput,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  IconButton
} from 'injast-core/components';
```

### Color Constants Pattern

Colors are imported from `'injast-core/constants'`:

```typescript
import { defaultColors } from 'injast-core/constants';
```

**Available color properties:**
- `defaultColors.neutral[50]`, `[100]`, `[300]`, etc.
- `defaultColors.neutral.light`
- `defaultColors.neutral.main`
- `defaultColors.neutral.dark`
- `defaultColors.primary.main`
- `defaultColors.success.main`
- `defaultColors.danger.main`

### RTL Support Pattern

- Icons use `startAdornment` (appears on right in RTL)
- Padding uses `pr` (padding-right) for RTL
- Text direction can be set with `dir="rtl"` or `dir="ltr"` on containers

### Size Options

- `size="small"` - Available on TextField, Radio, Select
- `height={40}` or `height={46}` - Custom height for TextField
- `buttonSize="XS"` - Available on Button component

### Error Handling Pattern

```typescript
<TextField
  {...register('fieldName')}
  error={!!errors.fieldName}
  helperText={errors.fieldName?.message}
/>
```

### Icon Integration Pattern

```typescript
startAdornment={
  <IconComponent 
    size={20} 
    color={defaultColors.neutral.light} 
  />
}
```

---

## Complete Examples

### Example 1: Login Form with Mobile Number

**File:** `Sample code/routes/(auth)/_authLayout/components/InputNumber.tsx`

Complete working example with:
- Zod validation
- react-hook-form integration
- Error handling
- Loading states
- Custom input validation (numeric only)

### Example 2: OTP Input Form

**File:** `Sample code/routes/(auth)/_authLayout/components/InputOtp.tsx`

Complete working example with:
- OtpInput component
- Controlled state management
- Form integration with hidden input
- Countdown timer
- Resend functionality

### Example 3: Search with Filters

**File:** `Sample code/routes/(dashboard)/_dashboardLayout/customers/$customerId.tsx`

Complete working example with:
- TextField for search
- RadioGroup for filters
- Multiple form controls in one layout

---

## Best Practices

1. **Always use TypeScript types** - Define types for form data
2. **Use Zod schemas** - For validation with react-hook-form
3. **Error handling** - Always show errors with `error` and `helperText` props
4. **Loading states** - Disable inputs during submission
5. **RTL support** - Use `startAdornment` for icons, `pr` for padding
6. **Consistent sizing** - Use `size="small"` and custom `height` for consistency
7. **Controlled components** - Use `value` and `onChange` for controlled inputs
8. **Form validation** - Use `disabled={!isValid}` on submit buttons



