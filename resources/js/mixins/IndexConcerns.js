import debounce from 'lodash/debounce'
import find from 'lodash/find'
import includes from 'lodash/includes'
import isNull from 'lodash/isNull'
import map from 'lodash/map'
import { Filterable, InteractsWithQueryString, mapProps } from './index'
import { capitalize } from '@/util'
import { computed } from 'vue'
import filter from 'lodash/filter'

export default {
  mixins: [Filterable, InteractsWithQueryString],

  props: {
    ...mapProps([
      'resourceName',
      'viaResource',
      'viaResourceId',
      'viaRelationship',
      'relationshipType',
      'disablePagination',
    ]),

    field: { type: Object },
    initialPerPage: { type: Number, required: false },
  },

  provide() {
    return {
      resourceHasId: computed(() => this.resourceHasId),
      authorizedToViewAnyResources: computed(
        () => this.authorizedToViewAnyResources
      ),
      authorizedToUpdateAnyResources: computed(
        () => this.authorizedToUpdateAnyResources
      ),
      authorizedToDeleteAnyResources: computed(
        () => this.authorizedToDeleteAnyResources
      ),
      authorizedToRestoreAnyResources: computed(
        () => this.authorizedToRestoreAnyResources
      ),
      selectedResourcesCount: computed(() => this.selectedResources.length),
      selectAllChecked: computed(() => this.selectAllChecked),
      selectAllMatchingChecked: computed(() => this.selectAllMatchingChecked),
      selectAllOrSelectAllMatchingChecked: computed(
        () => this.selectAllOrSelectAllMatchingChecked
      ),
      selectAllAndSelectAllMatchingChecked: computed(
        () => this.selectAllAndSelectAllMatchingChecked
      ),
      selectAllIndeterminate: computed(() => this.selectAllIndeterminate),
      orderByParameter: computed(() => this.orderByParameter),
      orderByDirectionParameter: computed(() => this.orderByDirectionParameter),
    }
  },

  data: () => ({
    actions: [],
    allMatchingResourceCount: 0,
    authorizedToRelate: false,
    canceller: null,
    currentPageLoadMore: null,
    deleteModalOpen: false,
    initialLoading: true,
    loading: true,
    orderBy: '',
    orderByDirection: '',
    pivotActions: null,
    resourceHasId: true,
    resourceHasActions: false,
    resourceResponse: null,
    resourceResponseError: null,
    resources: [],
    search: '',
    selectAllMatchingResources: false,
    selectedResources: [],
    softDeletes: false,
    trashed: '',
  }),

  async created() {
    if (Nova.missingResource(this.resourceName)) return Nova.visit('/404')

    const debouncer = debounce(
      callback => callback(),
      this.resourceInformation.debounce
    )

    this.initializeSearchFromQueryString()
    this.initializePerPageFromQueryString()
    this.initializeTrashedFromQueryString()
    this.initializeOrderingFromQueryString()

    await this.initializeFilters(this.lens || null)
    await this.getResources()

    if (!this.isLensView) {
      await this.getAuthorizationToRelate()
    }

    this.getActions()

    this.initialLoading = false

    this.$watch(
      () => {
        return (
          this.lens +
          this.resourceName +
          this.encodedFilters +
          this.currentSearch +
          this.currentPage +
          this.currentPerPage +
          this.currentOrderBy +
          this.currentOrderByDirection +
          this.currentTrashed
        )
      },
      () => {
        if (this.canceller !== null) this.canceller()

        if (this.currentPage === 1) {
          this.currentPageLoadMore = null
        }

        this.getResources()
      }
    )

    this.$watch('search', newValue => {
      this.search = newValue
      debouncer(() => this.performSearch())
    })
  },

  beforeUnmount() {
    if (this.canceller !== null) this.canceller()
  },

  methods: {
    /**
     * Handle resources loaded event.
     */
    handleResourcesLoaded() {
      this.loading = false

      if (!this.isLensView && this.resourceResponse.total !== null) {
        this.allMatchingResourceCount = this.resourceResponse.total
      } else {
        this.getAllMatchingResourceCount()
      }

      Nova.$emit(
        'resources-loaded',
        this.isLensView
          ? {
              resourceName: this.resourceName,
              lens: this.lens,
              mode: 'lens',
            }
          : {
              resourceName: this.resourceName,
              mode: this.isRelation ? 'related' : 'index',
            }
      )

      this.initializePolling()
    },

    /**
     * Select all of the available resources
     */
    selectAllResources() {
      this.selectedResources = this.resources.slice(0)
    },

    /**
     * Toggle the selection of all resources
     */
    toggleSelectAll(e) {
      if (e) {
        e.preventDefault()
      }

      if (this.selectAllChecked) {
        this.clearResourceSelections()
      } else {
        this.selectAllResources()
      }

      this.getActions()
    },

    /**
     * Toggle the selection of all matching resources in the database
     */
    toggleSelectAllMatching(e) {
      if (e) {
        e.preventDefault()
      }

      if (!this.selectAllMatchingResources) {
        this.selectAllResources()
        this.selectAllMatchingResources = true
      } else {
        this.selectAllMatchingResources = false
      }

      this.getActions()
    },

    /**
     * Deselect all selections
     */
    deselectAllResources(e) {
      if (e) {
        e.preventDefault()
      }

      this.clearResourceSelections()

      this.getActions()
    },

    /*
     * Update the resource selection status
     */
    updateSelectionStatus(resource) {
      if (!includes(this.selectedResources, resource)) {
        this.selectedResources.push(resource)
      } else {
        const index = this.selectedResources.indexOf(resource)
        if (index > -1) this.selectedResources.splice(index, 1)
      }

      this.selectAllMatchingResources = false

      this.getActions()
    },

    /**
     * Clear the selected resources and the "select all" states.
     */
    clearResourceSelections() {
      this.selectAllMatchingResources = false
      this.selectedResources = []
    },

    /**
     * Sort the resources by the given field.
     */
    orderByField(field) {
      let direction = this.currentOrderByDirection == 'asc' ? 'desc' : 'asc'

      if (this.currentOrderBy != field.sortableUriKey) {
        direction = 'asc'
      }

      this.updateQueryString({
        [this.orderByParameter]: field.sortableUriKey,
        [this.orderByDirectionParameter]: direction,
      })
    },

    /**
     * Reset the order by to its default state
     */
    resetOrderBy(field) {
      this.updateQueryString({
        [this.orderByParameter]: field.sortableUriKey,
        [this.orderByDirectionParameter]: null,
      })
    },

    /**
     * Sync the current search value from the query string.
     */
    initializeSearchFromQueryString() {
      this.search = this.currentSearch
    },

    /**
     * Sync the current order by values from the query string.
     */
    initializeOrderingFromQueryString() {
      this.orderBy = this.currentOrderBy
      this.orderByDirection = this.currentOrderByDirection
    },

    /**
     * Sync the trashed state values from the query string.
     */
    initializeTrashedFromQueryString() {
      this.trashed = this.currentTrashed
    },

    /**
     * Update the trashed constraint for the resource listing.
     */
    trashedChanged(trashedStatus) {
      this.trashed = trashedStatus
      this.updateQueryString({ [this.trashedParameter]: this.trashed })
    },

    /**
     * Update the per page parameter in the query string
     */
    updatePerPageChanged(perPage) {
      this.perPage = perPage
      this.perPageChanged()
    },

    /**
     * Select the next page.
     */
    selectPage(page) {
      this.updateQueryString({ [this.pageParameter]: page })
    },

    /**
     * Sync the per page values from the query string.
     */
    initializePerPageFromQueryString() {
      this.perPage =
        this.queryStringParams[this.perPageParameter] ||
        this.initialPerPage ||
        this.resourceInformation?.perPageOptions[0] ||
        null
    },

    /**
     * Close the delete modal.
     */
    closeDeleteModal() {
      this.deleteModalOpen = false
    },

    /**
     * Execute a search against the resource.
     */
    performSearch() {
      this.updateQueryString({
        [this.pageParameter]: 1,
        [this.searchParameter]: this.search,
      })
    },

    handleActionExecuted() {
      this.fetchPolicies()
      this.getResources()
    },
  },

  computed: {
    /**
     * Determine if the resource has any filters
     */
    hasFilters() {
      return this.$store.getters[`${this.resourceName}/hasFilters`]
    },

    /**
     * Get the name of the page query string variable.
     */
    pageParameter() {
      return this.viaRelationship
        ? this.viaRelationship + '_page'
        : this.resourceName + '_page'
    },

    /**
     * Determine if all resources are selected on the page.
     */
    selectAllChecked() {
      return this.selectedResources.length == this.resources.length
    },

    /**
     * Determine if Select All Dropdown state is indeterminate.
     */
    selectAllIndeterminate() {
      return (
        Boolean(this.selectAllChecked || this.selectAllMatchingChecked) &&
        Boolean(!this.selectAllAndSelectAllMatchingChecked)
      )
    },

    selectAllAndSelectAllMatchingChecked() {
      return this.selectAllChecked && this.selectAllMatchingChecked
    },

    selectAllOrSelectAllMatchingChecked() {
      return this.selectAllChecked || this.selectAllMatchingChecked
    },

    /**
     * Determine if all matching resources are selected.
     */
    selectAllMatchingChecked() {
      return this.selectAllMatchingResources
    },

    /**
     * Get the IDs for the selected resources.
     */
    selectedResourceIds() {
      return map(this.selectedResources, resource => resource.id.value)
    },

    /**
     * Get the Pivot IDs for the selected resources.
     */
    selectedPivotIds() {
      return map(
        this.selectedResources,
        resource => resource.id.pivotValue ?? null
      )
    },

    /**
     * Get the current search value from the query string.
     */
    currentSearch() {
      return this.queryStringParams[this.searchParameter] || ''
    },

    /**
     * Get the current order by value from the query string.
     */
    currentOrderBy() {
      return this.queryStringParams[this.orderByParameter] || ''
    },

    /**
     * Get the current order by direction from the query string.
     */
    currentOrderByDirection() {
      return this.queryStringParams[this.orderByDirectionParameter] || null
    },

    /**
     * Get the current trashed constraint value from the query string.
     */
    currentTrashed() {
      return this.queryStringParams[this.trashedParameter] || ''
    },

    /**
     * Determine if the current resource listing is via a many-to-many relationship.
     */
    viaManyToMany() {
      return (
        this.relationshipType == 'belongsToMany' ||
        this.relationshipType == 'morphToMany'
      )
    },

    /**
     * Determine if the index is a relation field
     */
    isRelation() {
      return Boolean(this.viaResourceId && this.viaRelationship)
    },

    /**
     * Get the singular name for the resource
     */
    singularName() {
      if (this.isRelation && this.field) {
        return capitalize(this.field.singularLabel)
      }

      if (this.resourceInformation) {
        return capitalize(this.resourceInformation.singularLabel)
      }
    },

    /**
     * Determine if there are any resources for the view
     */
    hasResources() {
      return Boolean(this.resources.length > 0)
    },

    /**
     * Determine if there any lenses for this resource
     */
    hasLenses() {
      return Boolean(this.lenses.length > 0)
    },

    /**
     * Determine if the resource should show any cards
     */
    shouldShowCards() {
      // Don't show cards if this resource is beings shown via a relations
      return Boolean(this.cards.length > 0 && !this.isRelation)
    },

    /**
     * Determine whether to show the selection checkboxes for resources
     */
    shouldShowCheckboxes() {
      return (
        Boolean(this.hasResources) &&
        Boolean(this.resourceHasId) &&
        Boolean(
          this.resourceHasActions ||
            this.authorizedToDeleteAnyResources ||
            this.canShowDeleteMenu
        )
      )
    },

    /**
     * Determine whether the delete menu should be shown to the user
     */
    shouldShowDeleteMenu() {
      return (
        Boolean(this.selectedResources.length > 0) && this.canShowDeleteMenu
      )
    },

    /**
     * Determine if any selected resources may be deleted.
     */
    authorizedToDeleteSelectedResources() {
      return Boolean(
        find(this.selectedResources, resource => resource.authorizedToDelete)
      )
    },

    /**
     * Determine if any selected resources may be force deleted.
     */
    authorizedToForceDeleteSelectedResources() {
      return Boolean(
        find(
          this.selectedResources,
          resource => resource.authorizedToForceDelete
        )
      )
    },

    /**
     * Determine if the user is authorized to view any listed resource.
     */
    authorizedToViewAnyResources() {
      return (
        this.resources.length > 0 &&
        Boolean(this.resourceHasId) &&
        Boolean(find(this.resources, resource => resource.authorizedToView))
      )
    },

    /**
     * Determine if the user is authorized to view any listed resource.
     */
    authorizedToUpdateAnyResources() {
      return (
        this.resources.length > 0 &&
        Boolean(this.resourceHasId) &&
        Boolean(find(this.resources, resource => resource.authorizedToUpdate))
      )
    },

    /**
     * Determine if the user is authorized to delete any listed resource.
     */
    authorizedToDeleteAnyResources() {
      return (
        this.resources.length > 0 &&
        Boolean(this.resourceHasId) &&
        Boolean(find(this.resources, resource => resource.authorizedToDelete))
      )
    },

    /**
     * Determine if the user is authorized to force delete any listed resource.
     */
    authorizedToForceDeleteAnyResources() {
      return (
        this.resources.length > 0 &&
        Boolean(this.resourceHasId) &&
        Boolean(
          find(this.resources, resource => resource.authorizedToForceDelete)
        )
      )
    },

    /**
     * Determine if any selected resources may be restored.
     */
    authorizedToRestoreSelectedResources() {
      return (
        Boolean(this.resourceHasId) &&
        Boolean(
          find(this.selectedResources, resource => resource.authorizedToRestore)
        )
      )
    },

    /**
     * Determine if the user is authorized to restore any listed resource.
     */
    authorizedToRestoreAnyResources() {
      return (
        this.resources.length > 0 &&
        Boolean(this.resourceHasId) &&
        Boolean(find(this.resources, resource => resource.authorizedToRestore))
      )
    },

    /**
     * Return the currently encoded filter string from the store
     */
    encodedFilters() {
      return this.$store.getters[`${this.resourceName}/currentEncodedFilters`]
    },

    /**
     * Return the initial encoded filters from the query string
     */
    initialEncodedFilters() {
      return this.queryStringParams[this.filterParameter] || ''
    },

    /**
     * Return the pagination component for the resource.
     */
    paginationComponent() {
      return `pagination-${Nova.config('pagination') || 'links'}`
    },

    /**
     * Determine if the resources has a next page.
     */
    hasNextPage() {
      return Boolean(
        this.resourceResponse && this.resourceResponse.next_page_url
      )
    },

    /**
     * Determine if the resources has a previous page.
     */
    hasPreviousPage() {
      return Boolean(
        this.resourceResponse && this.resourceResponse.prev_page_url
      )
    },

    /**
     * Return the total pages for the resource.
     */
    totalPages() {
      return Math.ceil(this.allMatchingResourceCount / this.currentPerPage)
    },

    /**
     * Return the resource count label
     */
    resourceCountLabel() {
      const first = this.perPage * (this.currentPage - 1)

      return (
        this.resources.length &&
        `${Nova.formatNumber(first + 1)}-${Nova.formatNumber(
          first + this.resources.length
        )} ${this.__('of')} ${Nova.formatNumber(this.allMatchingResourceCount)}`
      )
    },

    /**
     * Get the current per page value from the query string.
     */
    currentPerPage() {
      return this.perPage
    },

    /**
     * The per-page options configured for this resource.
     */
    perPageOptions() {
      if (this.resourceResponse) {
        return this.resourceResponse.per_page_options
      }
    },

    /**
     * Get the default label for the create button
     */
    createButtonLabel() {
      if (this.resourceInformation)
        return this.resourceInformation.createButtonLabel

      return this.__('Create')
    },

    /**
     * Build the resource request query string.
     */
    resourceRequestQueryString() {
      const queryString = {
        search: this.currentSearch,
        filters: this.encodedFilters,
        orderBy: this.currentOrderBy,
        orderByDirection: this.currentOrderByDirection,
        perPage: this.currentPerPage,
        trashed: this.currentTrashed,
        page: this.currentPage,
        viaResource: this.viaResource,
        viaResourceId: this.viaResourceId,
        viaRelationship: this.viaRelationship,
        viaResourceRelationship: this.viaResourceRelationship,
        relationshipType: this.relationshipType,
      }

      if (!this.lensName) {
        queryString['viaRelationship'] = this.viaRelationship
      }

      return queryString
    },

    /**
     * Determine if the action selector should be shown.
     */
    shouldShowActionSelector() {
      return this.selectedResources.length > 0 || this.haveStandaloneActions
    },

    /**
     * Determine if the view is a resource index or a lens.
     */
    isLensView() {
      return this.lens !== '' && this.lens != undefined && this.lens != null
    },

    /**
     * Determine whether the pagination component should be shown.
     */
    shouldShowPagination() {
      return (
        this.disablePagination !== true &&
        this.resourceResponse &&
        (this.hasResources || this.hasPreviousPage)
      )
    },

    /**
     * Return the current count of all resources
     */
    currentResourceCount() {
      return this.resources.length
    },

    /**
     * Get the name of the search query string variable.
     */
    searchParameter() {
      return this.viaRelationship
        ? this.viaRelationship + '_search'
        : this.resourceName + '_search'
    },

    /**
     * Get the name of the order by query string variable.
     */
    orderByParameter() {
      return this.viaRelationship
        ? this.viaRelationship + '_order'
        : this.resourceName + '_order'
    },

    /**
     * Get the name of the order by direction query string variable.
     */
    orderByDirectionParameter() {
      return this.viaRelationship
        ? this.viaRelationship + '_direction'
        : this.resourceName + '_direction'
    },

    /**
     * Get the name of the trashed constraint query string variable.
     */
    trashedParameter() {
      return this.viaRelationship
        ? this.viaRelationship + '_trashed'
        : this.resourceName + '_trashed'
    },

    /**
     * Get the name of the per page query string variable.
     */
    perPageParameter() {
      return this.viaRelationship
        ? this.viaRelationship + '_per_page'
        : this.resourceName + '_per_page'
    },

    /**
     * Determine whether there are any standalone actions.
     */
    haveStandaloneActions() {
      return filter(this.allActions, a => a.standalone === true).length > 0
    },

    /**
     * Return the available actions.
     */
    availableActions() {
      return this.actions
    },

    /**
     * Determine if the resource has any pivot actions available.
     */
    hasPivotActions() {
      return this.pivotActions && this.pivotActions.actions.length > 0
    },

    /**
     * Get the name of the pivot model for the resource.
     */
    pivotName() {
      return this.pivotActions ? this.pivotActions.name : ''
    },

    /**
     * Determine if the resource has any actions available.
     */
    actionsAreAvailable() {
      return this.allActions.length > 0
    },

    /**
     * Get all of the actions available to the resource.
     */
    allActions() {
      return this.hasPivotActions
        ? this.actions.concat(this.pivotActions.actions)
        : this.actions
    },

    availableStandaloneActions() {
      return this.allActions.filter(a => a.standalone === true)
    },

    /**
     * Get the selected resources for the action selector.
     */
    selectedResourcesForActionSelector() {
      return this.selectAllMatchingChecked ? 'all' : this.selectedResources
    },
  },
}
