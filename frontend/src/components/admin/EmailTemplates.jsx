import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const EmailTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [viewingTemplate, setViewingTemplate] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [formData, setFormData] = useState({
        template_type: '',
        template_name: '',
        subject: '',
        html_body: '',
        is_active: true,
        include_logo: false
    });

    const templateTypes = [
        { value: 'registration', label: 'User Registration' },
        { value: 'content_submitted', label: 'Content Submitted for Review' },
        { value: 'content_approved', label: 'Content Approved' },
        { value: 'content_rejected', label: 'Content Rejected/Changes Requested' },
        { value: 'content_published', label: 'Content Published' }
    ];

    const availableVariables = {
        registration: ['first_name', 'last_name', 'email', 'login_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
        content_submitted: ['first_name', 'last_name', 'content_title', 'category', 'submitted_date', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
        content_approved: ['first_name', 'last_name', 'content_title', 'category', 'approved_date', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
        content_rejected: ['first_name', 'last_name', 'content_title', 'category', 'reviewed_date', 'feedback', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year'],
        content_published: ['first_name', 'last_name', 'content_title', 'category', 'published_date', 'article_url', 'dashboard_url', 'website_logo_html', 'website_logo_img', 'website_logo', 'logo', 'site_name', 'year']
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/email-templates', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setTemplates(data.templates || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setFormData({
            template_type: '',
            template_name: '',
            subject: '',
            html_body: '',
            is_active: true,
            include_logo: false
        });
        setShowModal(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            template_type: template.template_type,
            template_name: template.template_name,
            subject: template.subject,
            html_body: template.html_body,
            is_active: template.is_active,
            include_logo: template.include_logo || false
        });
        setShowModal(true);
    };

    const handleView = async (template) => {
        setViewingTemplate(template);
        setPreviewHtml('');
        setPreviewLoading(true);
        try {
            const renderedHtml = await renderPreviewHtml(template);
            setPreviewHtml(renderedHtml);
        } catch (error) {
            console.error('Error rendering preview:', error);
            setPreviewHtml('<div style="padding: 20px; text-align: center; color: red;">Error rendering preview</div>');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`/api/email-templates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
        }
    };

    const handleToggleActive = async (id) => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`/api/email-templates/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchTemplates();
        } catch (error) {
            console.error('Error toggling template:', error);
            alert('Failed to toggle template status');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('accessToken');
            const url = editingTemplate 
                ? `/api/email-templates/${editingTemplate.id}`
                : '/api/email-templates';
            
            const method = editingTemplate ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            setShowModal(false);
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template');
        }
    };

    const insertVariable = (variable) => {
        setFormData(prev => ({
            ...prev,
            html_body: prev.html_body + `{{${variable}}}`
        }));
    };

    const renderPreviewHtml = async (template) => {
        let html = template.html_body;
        
        // Handle logo rendering in preview
        if (template.include_logo) {
            try {
                const response = await fetch('/api/site-settings');
                const data = await response.json();
                const settings = data.settings;
                const logoUrl = settings?.website_main_logo || settings?.website_logo || '';
                
                if (logoUrl) {
                    const logoHtml = `<div style="text-align:center;margin-bottom:15px;">
                        <img src="${logoUrl}" alt="Company Logo" style="max-width:150px;height:auto;display:block;margin:0 auto;" />
                    </div>`;
                    
                    // Replace logo placeholders
                    html = html
                        .replace(/\{\{website_logo_html\}\}/g, logoHtml)
                        .replace(/\{\{website_logo_img\}\}/g, `<img src="${logoUrl}" alt="Company Logo" style="max-width:180px;height:auto;display:block;margin:0 auto;" />`)
                        .replace(/\{\{website_logo\}\}/g, logoUrl)
                        .replace(/\{\{logo\}\}/g, logoUrl);
                    
                    // If no placeholder exists, prepend logo to content
                    const hasLogoPlaceholder = /\{\{(website_logo_html|website_logo_img|website_logo|logo)\}\}/i.test(template.html_body);
                    if (!hasLogoPlaceholder) {
                        html = `${logoHtml}${html}`;
                    }
                }
            } catch (error) {
                console.error('Error fetching logo for preview:', error);
            }
        } else {
            // Remove logo placeholders if logo is not enabled
            html = html
                .replace(/\{\{website_logo_html\}\}/g, '')
                .replace(/\{\{website_logo_img\}\}/g, '')
                .replace(/\{\{website_logo\}\}/g, '')
                .replace(/\{\{logo\}\}/g, '');
        }
        
        // Replace basic variables for preview
        html = html
            .replace(/\{\{first_name\}\}/g, 'John')
            .replace(/\{\{last_name\}\}/g, 'Doe')
            .replace(/\{\{email\}\}/g, 'john.doe@example.com')
            .replace(/\{\{site_name\}\}/g, 'TgsTechInfo')
            .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
        
        return html;
    };

    if (loading) {
        return <div className="p-6">Loading templates...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Email Templates</h1>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <FaPlus /> Create Template
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((template) => (
                            <tr key={template.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {templateTypes.find(t => t.value === template.template_type)?.label || template.template_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {template.template_name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {template.subject}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={template.include_logo ? 'text-green-600' : 'text-gray-400'}>
                                        {template.include_logo ? '✓' : '✗'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleToggleActive(template.id)}
                                        className={`flex items-center gap-1 ${template.is_active ? 'text-green-600' : 'text-gray-400'}`}
                                    >
                                        {template.is_active ? <FaToggleOn /> : <FaToggleOff />}
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleView(template)}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                        title="View"
                                    >
                                        <FaEye />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {templates.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No templates found. Create your first template to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                {editingTemplate ? 'Edit Template' : 'Create Template'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Template Type
                                    </label>
                                    <select
                                        value={formData.template_type}
                                        onChange={(e) => setFormData({...formData, template_type: e.target.value})}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                        disabled={!!editingTemplate}
                                    >
                                        <option value="">Select type</option>
                                        {templateTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Template Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.template_name}
                                        onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Subject
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2"
                                    required
                                    placeholder="Use {{variable}} for dynamic content"
                                />
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Include Company Logo
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Display the Website Main Logo from Branding settings in this email
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.include_logo}
                                            onChange={(e) => setFormData({...formData, include_logo: e.target.checked})}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                {formData.include_logo && (
                                    <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                                        <p className="text-xs text-blue-700">
                                            ℹ️ The logo will be automatically inserted from your CMS Branding settings. 
                                            Make sure your Website Main Logo is configured in the Branding section.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    HTML Body
                                </label>
                                <textarea
                                    value={formData.html_body}
                                    onChange={(e) => setFormData({...formData, html_body: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 h-64 font-mono text-sm"
                                    required
                                    placeholder="Enter HTML content. Use {{variable}} for dynamic content."
                                />
                            </div>

                            {formData.template_type && availableVariables[formData.template_type] && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Available Variables (click to insert)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableVariables[formData.template_type].map(variable => (
                                            <button
                                                key={variable}
                                                type="button"
                                                onClick={() => insertVariable(variable)}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
                                            >
                                                {'{{' + variable + '}}'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Active</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingTemplate ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewingTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">Template Preview</h2>
                            <button
                                onClick={() => setViewingTemplate(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <p className="text-gray-900">
                                    {templateTypes.find(t => t.value === viewingTemplate.template_type)?.label || viewingTemplate.template_type}
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <p className="text-gray-900">{viewingTemplate.template_name}</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject
                                </label>
                                <p className="text-gray-900">{viewingTemplate.subject}</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Include Company Logo
                                </label>
                                <p className="text-gray-900">
                                    {viewingTemplate.include_logo ? '✓ Yes' : '✗ No'}
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    HTML Preview
                                </label>
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    {previewLoading ? (
                                        <div className="flex items-center justify-center h-96 text-gray-500">
                                            Loading preview...
                                        </div>
                                    ) : previewHtml ? (
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="w-full h-96 border-0"
                                            title="Email Preview"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-96 text-gray-500">
                                            No preview available
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    HTML Source
                                </label>
                                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                    {viewingTemplate.html_body}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailTemplates;
