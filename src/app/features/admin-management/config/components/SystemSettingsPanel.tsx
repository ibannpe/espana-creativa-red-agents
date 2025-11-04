// ABOUTME: Component for managing system-wide settings
// ABOUTME: Provides interface to view and update platform configuration

import { useState } from 'react'
import { Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useSystemSettingsQuery } from '../hooks/queries/useSystemSettingsQuery'
import { useUpdateSystemSettingMutation } from '../hooks/mutations/useUpdateSystemSettingMutation'
import type { SystemSetting } from '../data/schemas/config.schema'

export const SystemSettingsPanel = () => {
  const { data: settings, isLoading } = useSystemSettingsQuery()
  const updateMutation = useUpdateSystemSettingMutation()
  const [editedValues, setEditedValues] = useState<Record<string, any>>({})

  const handleValueChange = (key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (setting: SystemSetting) => {
    const newValue = editedValues[setting.key]
    if (newValue === undefined) return

    // Convert value based on data_type before sending
    let valueToSend = newValue
    if (setting.data_type === 'boolean') {
      valueToSend = newValue
    } else if (setting.data_type === 'number') {
      valueToSend = Number(newValue)
    } else if (setting.data_type === 'string' || setting.data_type === 'text') {
      valueToSend = JSON.stringify(newValue)
    }

    await updateMutation.mutateAsync({
      key: setting.key,
      data: { value: valueToSend }
    })

    // Clear edited value after successful save
    setEditedValues(prev => {
      const newState = { ...prev }
      delete newState[setting.key]
      return newState
    })
  }

  const renderSettingInput = (setting: SystemSetting) => {
    const currentValue = editedValues[setting.key] !== undefined
      ? editedValues[setting.key]
      : parseValue(setting.value, setting.data_type)

    const hasChanges = editedValues[setting.key] !== undefined

    switch (setting.data_type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{formatKey(setting.key)}</Label>
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={currentValue}
                onCheckedChange={(checked) => handleValueChange(setting.key, checked)}
              />
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={() => handleSave(setting)}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{formatKey(setting.key)}</Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
            <div className="flex items-center gap-2">
              <Input
                id={setting.key}
                type="number"
                value={currentValue}
                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                className="flex-1"
              />
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={() => handleSave(setting)}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              )}
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{formatKey(setting.key)}</Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
            <Textarea
              id={setting.key}
              value={currentValue}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              rows={3}
            />
            {hasChanges && (
              <Button
                size="sm"
                onClick={() => handleSave(setting)}
                disabled={updateMutation.isPending}
                className="mt-2"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            )}
          </div>
        )

      case 'string':
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{formatKey(setting.key)}</Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
            <div className="flex items-center gap-2">
              <Input
                id={setting.key}
                type="text"
                value={currentValue}
                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                className="flex-1"
              />
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={() => handleSave(setting)}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              )}
            </div>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Cargando configuraciones...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Configuraciones del Sistema</h3>
        <p className="text-sm text-muted-foreground">
          Gestiona las configuraciones globales de la plataforma
        </p>
      </div>

      <div className="grid gap-4">
        {settings?.map((setting) => (
          <Card key={setting.key}>
            <CardContent className="pt-6">
              {renderSettingInput(setting)}
            </CardContent>
          </Card>
        ))}
        {(!settings || settings.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay configuraciones disponibles
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Los cambios en las configuraciones afectan inmediatamente a toda la plataforma</li>
            <li>• Asegúrate de entender el impacto antes de modificar valores críticos</li>
            <li>• Todos los cambios quedan registrados con tu usuario</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to parse JSONB value based on data type
function parseValue(value: any, dataType: string): any {
  if (dataType === 'boolean') {
    return Boolean(value)
  }
  if (dataType === 'number') {
    return Number(value)
  }
  if (dataType === 'string' || dataType === 'text') {
    // Remove quotes from JSON string values
    if (typeof value === 'string') {
      return value.replace(/^"(.*)"$/, '$1')
    }
    return value
  }
  return value
}

// Helper function to format setting key to human-readable text
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
